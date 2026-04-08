from __future__ import annotations

from pathlib import Path

from .config import AppConfig
from .export import export_blocks, export_graph, export_nodes, export_outline, export_review_overlay
from .graph import build_graph
from .merge import merge_blocks
from .nodes import build_nodes
from .ocr import run_ocr
from .preprocess import preprocess_image
from .tiling import generate_tiles


def run_full_pipeline(image_path: str | Path, config: AppConfig) -> dict[str, str]:
    preprocess_image(image_path, config)
    tiles = generate_tiles(image_path, config)
    raw_blocks = run_ocr(tiles, config)
    export_blocks(raw_blocks, config, "ocr_raw.jsonl")
    merged_blocks = merge_blocks(raw_blocks)
    export_blocks(merged_blocks, config, "ocr_merged.json")
    nodes = build_nodes(
        merged_blocks,
        merge_distance=config.node_merge_distance,
        vertical_gap=config.node_merge_vertical_gap,
    )
    export_nodes(nodes, config)
    graph_payload = build_graph(
        nodes,
        max_parent_distance=config.graph_max_parent_distance,
        horizontal_bias=config.graph_horizontal_bias,
        vertical_tolerance=config.graph_vertical_tolerance,
    )
    export_graph(graph_payload, config)
    outline_path = export_outline(graph_payload, config)
    overlay_path = export_review_overlay(graph_payload, image_path, config)
    return {
        "ocr_raw": str(config.artifacts_path / "ocr_raw.jsonl"),
        "ocr_merged": str(config.artifacts_path / "ocr_merged.json"),
        "nodes": str(config.artifacts_path / "nodes.json"),
        "graph": str(config.artifacts_path / "graph.json"),
        "outline": str(outline_path),
        "overlay": str(overlay_path),
    }
