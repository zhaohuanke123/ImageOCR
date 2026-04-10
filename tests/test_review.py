from pathlib import Path

from PIL import Image

from ocr_pipeline.config import AppConfig
from ocr_pipeline.io_utils import write_json
from ocr_pipeline.review import build_review_bundle, detect_review_issues


def sample_graph() -> dict:
    return {
        "nodes": [
            {
                "id": "node_root",
                "text": "VeryLongASCIIIdentifierWithoutSpaces",
                "bbox": [[0, 0], [220, 0], [220, 300], [0, 300]],
                "lines": ["line"] * 9,
                "confidence": 0.4,
                "block_ids": ["b1"],
                "parent_id": None,
                "children": ["node_child"],
            },
            {
                "id": "node_child",
                "text": "子节点",
                "bbox": [[120, 50], [220, 50], [220, 90], [120, 90]],
                "lines": ["子节点"],
                "confidence": 0.95,
                "block_ids": ["b2"],
                "parent_id": "node_root",
                "children": [],
            },
        ],
        "edges": [{"parent_id": "node_root", "child_id": "node_child", "score": 0.3, "reason": "weak"}],
        "roots": ["node_root"],
    }


def test_detect_review_issues_flags_expected_types() -> None:
    issues = detect_review_issues(sample_graph(), AppConfig())
    issue_types = {issue["issue_type"] for issue in issues}
    assert "orphan_root" in issue_types
    assert "low_confidence_node" in issue_types
    assert "oversized_node" in issue_types
    assert "text_outlier" in issue_types
    assert "weak_edge" in issue_types


def test_build_review_bundle_outputs_html_and_issue_files(tmp_path: Path) -> None:
    image_path = tmp_path / "sample.png"
    Image.new("RGB", (400, 300), "white").save(image_path)
    graph = sample_graph()
    write_json(tmp_path / "graph.json", graph)
    write_json(tmp_path / "nodes.json", graph["nodes"])
    write_json(
        tmp_path / "ocr_merged.json",
        [{"id": "b1", "text": "Root", "bbox": [[10, 10], [80, 10], [80, 40], [10, 40]], "confidence": 0.95, "tile_id": "tile", "scale": 1.0}],
    )
    outputs = build_review_bundle(
        image_path=image_path,
        graph_path=tmp_path / "graph.json",
        nodes_path=tmp_path / "nodes.json",
        blocks_path=tmp_path / "ocr_merged.json",
        output_dir=tmp_path / "review",
        config=AppConfig(),
    )
    assert Path(outputs["html"]).exists()
    assert Path(outputs["issues_json"]).exists()
    assert Path(outputs["issues_csv"]).exists()
    html_content = Path(outputs["html"]).read_text(encoding="utf-8")
    # Check for data injection and title (React build) or fallback template
    assert "review-data" in html_content or "OCR 复核器" in html_content
    assert "OCR Review" in html_content or "OCR 复核器" in html_content
