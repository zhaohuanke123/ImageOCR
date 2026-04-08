import json
from pathlib import Path

from PIL import Image

from ocr_pipeline.config import AppConfig
from ocr_pipeline.io_utils import write_json
from ocr_pipeline.regression import build_seed_dataset, run_regression


def test_run_regression_creates_summary(tmp_path: Path) -> None:
    image_path = tmp_path / "sample.png"
    Image.new("RGB", (500, 500), "white").save(image_path)
    write_json(
        tmp_path / "ocr_merged.json",
        [{"id": "b1", "text": "Engine", "bbox": [[50, 50], [120, 50], [120, 80], [50, 80]], "confidence": 0.99, "tile_id": "tile", "scale": 1.0}],
    )
    write_json(
        tmp_path / "nodes.json",
        [{"id": "node_1", "text": "Engine", "bbox": [[50, 50], [150, 50], [150, 90], [50, 90]], "lines": ["Engine"], "confidence": 0.99, "block_ids": ["b1"], "parent_id": None, "children": []}],
    )
    write_json(tmp_path / "graph.json", {"nodes": json.loads((tmp_path / "nodes.json").read_text(encoding="utf-8")), "edges": [], "roots": ["node_1"]})
    write_json(
        tmp_path / "dataset" / "region_01.json",
        {
            "region_id": "region_01",
            "image_path": str(image_path),
            "crop_bbox": [0, 0, 300, 300],
            "expected_blocks": [{"text": "Engine", "bbox": [45, 45, 125, 85]}],
            "expected_nodes": [{"id": "expected_node_1", "text": "Engine", "bbox": [45, 45, 155, 95], "lines": ["Engine"]}],
            "expected_edges": [],
        },
    )
    summary = run_regression(
        dataset_dir=tmp_path / "dataset",
        image_path=image_path,
        blocks_path=tmp_path / "ocr_merged.json",
        nodes_path=tmp_path / "nodes.json",
        graph_path=tmp_path / "graph.json",
        output_dir=tmp_path / "reports",
        config=AppConfig(),
    )
    assert summary["region_count"] == 1
    assert (tmp_path / "reports" / "summary.json").exists()
    assert (tmp_path / "reports" / "summary.md").exists()


def test_run_regression_accepts_parent_child_ids(tmp_path: Path) -> None:
    image_path = tmp_path / "sample.png"
    Image.new("RGB", (500, 500), "white").save(image_path)
    write_json(
        tmp_path / "ocr_merged.json",
        [{"id": "b1", "text": "Root", "bbox": [[50, 50], [120, 50], [120, 80], [50, 80]], "confidence": 0.99, "tile_id": "tile", "scale": 1.0}],
    )
    nodes = [
        {"id": "node_root", "text": "Root", "bbox": [[50, 50], [150, 50], [150, 90], [50, 90]], "lines": ["Root"], "confidence": 0.99, "block_ids": ["b1"], "parent_id": None, "children": ["node_child"]},
        {"id": "node_child", "text": "Child", "bbox": [[200, 50], [280, 50], [280, 90], [200, 90]], "lines": ["Child"], "confidence": 0.99, "block_ids": [], "parent_id": "node_root", "children": []},
    ]
    write_json(tmp_path / "nodes.json", nodes)
    write_json(tmp_path / "graph.json", {"nodes": nodes, "edges": [{"parent_id": "node_root", "child_id": "node_child", "score": 0.9, "reason": "ok"}], "roots": ["node_root"]})
    write_json(
        tmp_path / "dataset" / "region_02.json",
        {
            "region_id": "region_02",
            "image_path": str(image_path),
            "crop_bbox": [0, 0, 400, 200],
            "expected_blocks": [{"text": "Root", "bbox": [45, 45, 125, 85]}],
            "expected_nodes": [
                {"id": "expected_root", "text": "Root", "bbox": [45, 45, 155, 95], "lines": ["Root"]},
                {"id": "expected_child", "text": "Child", "bbox": [195, 45, 285, 95], "lines": ["Child"]},
            ],
            "expected_edges": [{"parent_id": "expected_root", "child_id": "expected_child"}],
        },
    )
    summary = run_regression(
        dataset_dir=tmp_path / "dataset",
        image_path=image_path,
        blocks_path=tmp_path / "ocr_merged.json",
        nodes_path=tmp_path / "nodes.json",
        graph_path=tmp_path / "graph.json",
        output_dir=tmp_path / "reports",
        config=AppConfig(),
    )
    assert summary["regions"][0]["graph"]["edge_recall"] == 1.0


def test_build_seed_dataset_creates_region_json(tmp_path: Path) -> None:
    image_path = tmp_path / "sample.png"
    Image.new("RGB", (600, 600), "white").save(image_path)
    write_json(
        tmp_path / "ocr_merged.json",
        [{"id": "b1", "text": "Root", "bbox": [[60, 60], [120, 60], [120, 90], [60, 90]], "confidence": 0.9, "tile_id": "tile", "scale": 1.0}],
    )
    write_json(
        tmp_path / "graph.json",
        {"nodes": [{"id": "node_root", "text": "Root", "bbox": [[50, 50], [150, 50], [150, 90], [50, 90]], "lines": ["Root"], "confidence": 0.9, "block_ids": ["b1"], "parent_id": None, "children": []}], "edges": [], "roots": ["node_root"]},
    )
    result = build_seed_dataset(
        image_path=image_path,
        blocks_path=tmp_path / "ocr_merged.json",
        graph_path=tmp_path / "graph.json",
        output_dir=tmp_path / "baseline",
        region_count=1,
    )
    assert result["region_count"] == 1
    payload = json.loads((tmp_path / "baseline" / "region_01.json").read_text(encoding="utf-8"))
    assert payload["needs_review"] is True
