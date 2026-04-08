from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from PIL import Image

from .io_utils import ensure_dir, read_json, read_text, write_text


def _localize_bbox(bbox: list[float], crop_bbox: list[int]) -> list[float]:
    x0, y0, _, _ = crop_bbox
    return [bbox[0] - x0, bbox[1] - y0, bbox[2] - x0, bbox[3] - y0]


def _normalize_region(region: dict[str, Any], region_path: Path) -> dict[str, Any]:
    crop_bbox = region["crop_bbox"]
    nodes = []
    for index, node in enumerate(region.get("expected_nodes", []), start=1):
        node_id = node.get("id") or f"manual_node_{index:03d}"
        text = node.get("text", "")
        lines = node.get("lines") or [line for line in text.splitlines() if line.strip()] or [text]
        nodes.append({"id": node_id, "text": text, "bbox": _localize_bbox(list(node["bbox"]), crop_bbox), "lines": lines})

    text_to_id = {node["text"]: node["id"] for node in nodes}
    edges = []
    for edge in region.get("expected_edges", []):
        parent_id = edge.get("parent_id") or text_to_id.get(edge.get("parent_text", ""))
        child_id = edge.get("child_id") or text_to_id.get(edge.get("child_text", ""))
        if parent_id and child_id:
            edges.append({"parent_id": parent_id, "child_id": child_id, "parent_text": edge.get("parent_text", ""), "child_text": edge.get("child_text", "")})

    blocks = []
    for index, block in enumerate(region.get("expected_blocks", []), start=1):
        blocks.append({
            "id": block.get("id") or f"block_{index:04d}",
            "text": block.get("text", ""),
            "confidence": float(block.get("confidence", 1.0)),
            "bbox": _localize_bbox(list(block["bbox"]), crop_bbox),
        })

    region["expected_blocks"] = blocks
    region["expected_nodes"] = nodes
    region["expected_edges"] = edges
    region["source_path"] = str(region_path)
    return region


def _editor_html(data: dict[str, Any]) -> str:
    template = read_text(Path(__file__).with_name("editor_template.html"))
    return template.replace("__EDITOR_DATA__", json.dumps(data, ensure_ascii=False))


def build_baseline_editor(region_path: str | Path, output_dir: str | Path) -> dict[str, str]:
    region_path = Path(region_path)
    output_dir = ensure_dir(output_dir)
    region = _normalize_region(read_json(region_path), region_path)
    image_path = Path(region["image_path"])
    if not image_path.is_absolute():
        image_path = (Path.cwd() / image_path).resolve()
    with Image.open(image_path) as image:
        width, height = image.size
    html_path = output_dir / f"{region['region_id']}_editor.html"
    data = {
        "region": region,
        "image_src": image_path.as_uri(),
        "image_source_path": str(region["image_path"]),
        "image_width": width,
        "image_height": height,
        "project_root_uri": f"{Path.cwd().resolve().as_uri()}/",
        "api_base": "http://127.0.0.1:8765",
    }
    write_text(html_path, _editor_html(data))
    return {"html": str(html_path)}
