from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from .config import AppConfig
from .io_utils import ensure_dir, read_json, write_json, write_text
from .merge import text_similarity
from .review import load_blocks, node_bounds


@dataclass(slots=True)
class MatchResult:
    expected_total: int
    predicted_total: int
    matched_pairs: list[tuple[int, int]]

    @property
    def recall(self) -> float:
        return len({pair[0] for pair in self.matched_pairs}) / self.expected_total if self.expected_total else 1.0

    @property
    def precision(self) -> float:
        return len({pair[1] for pair in self.matched_pairs}) / self.predicted_total if self.predicted_total else 1.0


def _bbox_iou(expected_bbox: list[float], predicted_bbox: list[float] | list[list[float]]) -> float:
    e_left, e_top, e_right, e_bottom = expected_bbox
    if predicted_bbox and isinstance(predicted_bbox[0], list):
        p_left = min(point[0] for point in predicted_bbox)
        p_top = min(point[1] for point in predicted_bbox)
        p_right = max(point[0] for point in predicted_bbox)
        p_bottom = max(point[1] for point in predicted_bbox)
    else:
        p_left, p_top, p_right, p_bottom = predicted_bbox
    inter_left = max(e_left, p_left)
    inter_top = max(e_top, p_top)
    inter_right = min(e_right, p_right)
    inter_bottom = min(e_bottom, p_bottom)
    if inter_left >= inter_right or inter_top >= inter_bottom:
        return 0.0
    inter = (inter_right - inter_left) * (inter_bottom - inter_top)
    union = (e_right - e_left) * (e_bottom - e_top) + (p_right - p_left) * (p_bottom - p_top) - inter
    return inter / union if union > 0 else 0.0


def _match_items(expected: list[dict[str, Any]], predicted: list[dict[str, Any]], min_similarity: float = 0.72) -> MatchResult:
    used: set[int] = set()
    matches: list[tuple[int, int]] = []
    for e_index, expected_item in enumerate(expected):
        best: tuple[float, int] | None = None
        for p_index, predicted_item in enumerate(predicted):
            if p_index in used:
                continue
            similarity = text_similarity(expected_item["text"], predicted_item["text"])
            overlap = _bbox_iou(expected_item["bbox"], predicted_item["bbox"])
            if similarity < min_similarity and overlap < 0.05:
                continue
            score = similarity * 0.8 + overlap * 0.2
            if best is None or score > best[0]:
                best = (score, p_index)
        if best is not None:
            matches.append((e_index, best[1]))
            used.add(best[1])
    return MatchResult(len(expected), len(predicted), matches)


def _filter_to_region(items: list[dict[str, Any]], crop_bbox: list[int]) -> list[dict[str, Any]]:
    x0, y0, x1, y1 = crop_bbox
    selected: list[dict[str, Any]] = []
    for item in items:
        bbox = item["bbox"]
        if bbox and isinstance(bbox[0], list):
            left = min(point[0] for point in bbox)
            top = min(point[1] for point in bbox)
            right = max(point[0] for point in bbox)
            bottom = max(point[1] for point in bbox)
        else:
            left, top, right, bottom = bbox
        cx = (left + right) / 2
        cy = (top + bottom) / 2
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            selected.append(item)
    return selected


def _normalize_nodes(raw_nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for node in raw_nodes:
        left, top, right, bottom = node_bounds(node)
        normalized.append(
            {
                "id": node["id"],
                "text": node["text"],
                "bbox": [left, top, right, bottom],
                "lines": node.get("lines", []),
            }
        )
    return normalized


def _render_diff_overlay(image_path: str | Path, crop_bbox: list[int], expected_nodes: list[dict[str, Any]], predicted_nodes: list[dict[str, Any]], output_path: str | Path) -> None:
    with Image.open(image_path) as image:
        image = image.convert("RGB")
        crop = image.crop(tuple(crop_bbox))
        draw = ImageDraw.Draw(crop)
        x0, y0, _, _ = crop_bbox
        for node in expected_nodes:
            left, top, right, bottom = node["bbox"]
            draw.rectangle((left - x0, top - y0, right - x0, bottom - y0), outline="lime", width=3)
        for node in predicted_nodes:
            left, top, right, bottom = node["bbox"]
            draw.rectangle((left - x0, top - y0, right - x0, bottom - y0), outline="red", width=2)
        ensure_dir(Path(output_path).parent)
        crop.save(output_path, quality=92)


def run_regression(dataset_dir: str | Path, image_path: str | Path, blocks_path: str | Path, nodes_path: str | Path, graph_path: str | Path, output_dir: str | Path, config: AppConfig) -> dict[str, Any]:
    annotations = sorted(Path(dataset_dir).glob("*.json"))
    blocks = load_blocks(blocks_path)
    raw_nodes = list(read_json(nodes_path))
    nodes = _normalize_nodes(raw_nodes)
    graph_payload = read_json(graph_path)
    edge_set = {(edge["parent_id"], edge["child_id"]) for edge in graph_payload.get("edges", [])}
    output_dir = ensure_dir(output_dir)
    fail_cases_dir = ensure_dir(output_dir / "fail_cases")
    overlay_dir = ensure_dir(output_dir / "diff_overlay")
    regions: list[dict[str, Any]] = []

    for annotation_path in annotations:
        annotation = read_json(annotation_path)
        crop_bbox = annotation["crop_bbox"]
        predicted_blocks = _filter_to_region(blocks, crop_bbox)
        predicted_nodes = _filter_to_region(nodes, crop_bbox)
        block_match = _match_items(annotation.get("expected_blocks", []), predicted_blocks)
        node_match = _match_items(annotation.get("expected_nodes", []), predicted_nodes)
        multiline_expected = [node for node in annotation.get("expected_nodes", []) if len(node.get("lines", [])) > 1]
        multiline_predicted = [node for node in predicted_nodes if len(node.get("lines", [])) > 1]
        multiline_match = _match_items(multiline_expected, multiline_predicted) if multiline_expected else MatchResult(0, 0, [])
        raw_region_nodes = _filter_to_region(raw_nodes, crop_bbox)
        predicted_ids_by_text: dict[str, list[str]] = {}
        for raw in raw_region_nodes:
            predicted_ids_by_text.setdefault(raw["text"], []).append(raw["id"])
        matched_prediction_ids = {}
        for expected_index, predicted_index in node_match.matched_pairs:
            expected_node = annotation["expected_nodes"][expected_index]
            matched_prediction_ids[expected_node["text"]] = raw_region_nodes[predicted_index]["id"]
            if "id" in expected_node:
                matched_prediction_ids[expected_node["id"]] = raw_region_nodes[predicted_index]["id"]
        edge_hits = 0
        for edge in annotation.get("expected_edges", []):
            parent_ref = edge.get("parent_id") or edge.get("parent_text")
            child_ref = edge.get("child_id") or edge.get("child_text")
            parent_id = matched_prediction_ids.get(parent_ref)
            child_id = matched_prediction_ids.get(child_ref)
            if parent_id and child_id and (parent_id, child_id) in edge_set:
                edge_hits += 1
        expected_edges = len(annotation.get("expected_edges", []))
        duplicate_rate = max(0.0, (len(predicted_blocks) - len({pair[1] for pair in block_match.matched_pairs})) / len(predicted_blocks)) if predicted_blocks else 0.0
        region = {
            "region_id": annotation["region_id"],
            "ocr": {"block_recall": round(block_match.recall, 4), "block_precision": round(block_match.precision, 4), "duplicate_rate": round(duplicate_rate, 4)},
            "nodes": {"node_recall": round(node_match.recall, 4), "node_precision": round(node_match.precision, 4), "multiline_merge_accuracy": round(multiline_match.recall if multiline_expected else 1.0, 4)},
            "graph": {"edge_recall": round(edge_hits / expected_edges if expected_edges else 1.0, 4), "root_count": len(graph_payload.get("roots", [])), "weak_edge_ratio": round(sum(1 for edge in graph_payload.get("edges", []) if edge.get("score", 0.0) < config.review_weak_edge_threshold) / max(len(graph_payload.get("edges", [])), 1), 4)},
        }
        regions.append(region)
        if region["ocr"]["block_recall"] < 0.8 or region["nodes"]["node_recall"] < 0.75 or region["graph"]["edge_recall"] < 0.75:
            write_json(fail_cases_dir / f"{annotation['region_id']}.json", {"annotation": annotation, "result": region})
            _render_diff_overlay(image_path, crop_bbox, annotation.get("expected_nodes", []), predicted_nodes, overlay_dir / f"{annotation['region_id']}.jpg")

    summary = {
        "dataset_dir": str(dataset_dir),
        "region_count": len(regions),
        "fail_case_count": len(list(fail_cases_dir.glob("*.json"))),
        "averages": {
            "block_recall": round(sum(item["ocr"]["block_recall"] for item in regions) / max(len(regions), 1), 4),
            "node_recall": round(sum(item["nodes"]["node_recall"] for item in regions) / max(len(regions), 1), 4),
            "edge_recall": round(sum(item["graph"]["edge_recall"] for item in regions) / max(len(regions), 1), 4),
        },
        "regions": regions,
    }
    write_json(output_dir / "summary.json", summary)
    write_text(output_dir / "summary.md", "\n".join(["# Regression Summary", "", f"- Regions: {summary['region_count']}", f"- Fail cases: {summary['fail_case_count']}", f"- Avg block recall: {summary['averages']['block_recall']}", f"- Avg node recall: {summary['averages']['node_recall']}", f"- Avg edge recall: {summary['averages']['edge_recall']}", ""] + [f"- `{region['region_id']}` OCR={region['ocr']['block_recall']} Node={region['nodes']['node_recall']} Edge={region['graph']['edge_recall']}" for region in regions]))
    return summary


def build_seed_dataset(image_path: str | Path, blocks_path: str | Path, graph_path: str | Path, output_dir: str | Path, region_count: int = 8) -> dict[str, Any]:
    image_path = Path(image_path)
    blocks = load_blocks(blocks_path)
    graph_payload = read_json(graph_path)
    nodes = sorted(graph_payload.get("nodes", []), key=lambda node: (node["bbox"][0][1], node["bbox"][0][0]))
    roots = [node for node in nodes if node.get("parent_id") is None][:region_count]
    output_dir = ensure_dir(output_dir)
    normalized_nodes = _normalize_nodes(nodes)

    with Image.open(image_path) as image:
        image = image.convert("RGB")
        for index, node in enumerate(roots, start=1):
            left, top, right, bottom = node_bounds(node)
            crop_bbox = [max(int(left - 180), 0), max(int(top - 160), 0), min(int(right + 560), image.width), min(int(bottom + 420), image.height)]
            image.crop(tuple(crop_bbox)).save(output_dir / f"region_{index:02d}.jpg", quality=92)
            region_blocks = _filter_to_region(blocks, crop_bbox)[:10]
            region_nodes = _filter_to_region(normalized_nodes, crop_bbox)[:6]
            expected_edges: list[dict[str, str]] = []
            for edge in graph_payload.get("edges", []):
                parent = next((item for item in nodes if item["id"] == edge["parent_id"]), None)
                child = next((item for item in nodes if item["id"] == edge["child_id"]), None)
                if not parent or not child:
                    continue
                p_left, p_top, _, _ = node_bounds(parent)
                c_left, c_top, _, _ = node_bounds(child)
                if crop_bbox[0] <= p_left <= crop_bbox[2] and crop_bbox[1] <= p_top <= crop_bbox[3] and crop_bbox[0] <= c_left <= crop_bbox[2] and crop_bbox[1] <= c_top <= crop_bbox[3]:
                    expected_edges.append(
                        {
                            "parent_id": parent["id"],
                            "child_id": child["id"],
                            "parent_text": parent["text"],
                            "child_text": child["text"],
                        }
                    )
            write_json(output_dir / f"region_{index:02d}.json", {"region_id": f"region_{index:02d}", "image_path": str(output_dir / f"region_{index:02d}.jpg"), "crop_bbox": crop_bbox, "expected_blocks": [{"text": block["text"], "bbox": [min(point[0] for point in block["bbox"]), min(point[1] for point in block["bbox"]), max(point[0] for point in block["bbox"]), max(point[1] for point in block["bbox"])]} for block in region_blocks], "expected_nodes": region_nodes, "expected_edges": expected_edges[:8], "seed_source": "current_prediction", "needs_review": True})
    write_text(output_dir / "README.md", "# Baseline Seed Dataset\n\n这些标注由当前预测结果自动生成，只能作为人工校对 seed。\n")
    return {"dataset_dir": str(output_dir), "region_count": len(roots)}
