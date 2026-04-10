from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

from .config import AppConfig
from .io_utils import ensure_dir, write_json, write_jsonl
from .models import MindmapNode, OCRBlock, TileSpec


def export_tiles(tiles: list[TileSpec], config: AppConfig) -> Path:
    path = config.artifacts_path / "tiles_manifest.json"
    write_json(path, [tile.to_dict() for tile in tiles])
    return path


def export_blocks(blocks: list[OCRBlock], config: AppConfig, filename: str) -> Path:
    path = config.artifacts_path / filename
    payload = [block.to_dict() for block in blocks]
    if path.suffix == ".jsonl":
        write_jsonl(path, payload)
    else:
        write_json(path, payload)
    return path


def export_nodes(nodes: list[MindmapNode], config: AppConfig) -> Path:
    path = config.artifacts_path / "nodes.json"
    write_json(path, [node.to_dict() for node in nodes])
    return path


def export_graph(graph_payload: dict, config: AppConfig, image_path: str | Path | None = None) -> Path:
    """Export graph data to JSON file.

    Args:
        graph_payload: Graph data with nodes, edges, and roots
        config: Application configuration
        image_path: Optional image path to include metadata (image_src, image_width, image_height)
    """
    path = config.artifacts_path / "graph.json"

    # Add image metadata if image_path is provided
    if image_path is not None:
        image_path = Path(image_path)
        with Image.open(image_path) as img:
            width, height = img.size

        # Add image metadata to the payload
        graph_payload = {
            **graph_payload,
            "image_src": image_path.resolve().as_uri(),
            "image_width": width,
            "image_height": height,
        }

    write_json(path, graph_payload)
    return path


def export_outline(graph_payload: dict, config: AppConfig) -> Path:
    nodes = {node["id"]: node for node in graph_payload["nodes"]}
    # Use roots if present, otherwise compute from parent_id
    if "roots" in graph_payload:
        roots = graph_payload["roots"]
    else:
        roots = [node["id"] for node in graph_payload["nodes"] if not node.get("parent_id")]
    lines: list[str] = []
    visited: set[str] = set()

    def visit(node_id: str, depth: int) -> None:
        if node_id not in nodes:  # 跳过不存在的节点
            return
        if node_id in visited:  # 跳过已访问的节点（防止循环引用）
            return
        visited.add(node_id)
        node = nodes[node_id]
        text = " ".join(part.strip() for part in node["text"].splitlines() if part.strip())
        lines.append(f"{'  ' * depth}- {text}")
        for child_id in node["children"]:
            visit(child_id, depth + 1)

    for root_id in roots:
        visit(root_id, 0)

    path = config.artifacts_path / "mindmap_outline.md"
    ensure_dir(path.parent)
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def export_review_overlay(graph_payload: dict, image_path: str | Path, config: AppConfig) -> Path:
    output_path = config.artifacts_path / "review_overlay.jpg"
    with Image.open(image_path) as image:
        image = image.convert("RGB")
        draw = ImageDraw.Draw(image)
        for node in graph_payload["nodes"]:
            bbox = node["bbox"]
            flat = [tuple(point) for point in bbox]
            draw.polygon(flat, outline="red", width=config.export_overlay_line_width)
            label = node["id"]
            draw.text((bbox[0][0], max(0, bbox[0][1] - 12)), label, fill="yellow")
        image.save(output_path, quality=92)
    return output_path
