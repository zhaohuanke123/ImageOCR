from pathlib import Path

from PIL import Image

from ocr_pipeline.editor import build_baseline_editor
from ocr_pipeline.io_utils import write_json


def test_build_baseline_editor_generates_html(tmp_path: Path) -> None:
    image_path = tmp_path / "region.jpg"
    Image.new("RGB", (400, 300), "white").save(image_path)
    region_path = tmp_path / "region_01.json"
    write_json(
        region_path,
        {
            "region_id": "region_01",
            "image_path": str(image_path),
            "crop_bbox": [0, 0, 400, 300],
            "expected_blocks": [],
            "expected_nodes": [
                {"text": "Node A", "bbox": [10, 10, 120, 50], "lines": ["Node A"]},
                {"id": "node_b", "text": "Node B", "bbox": [180, 10, 280, 50], "lines": ["Node B"]},
            ],
            "expected_edges": [{"parent_text": "Node A", "child_id": "node_b"}],
        },
    )
    outputs = build_baseline_editor(region_path=region_path, output_dir=tmp_path / "editors")
    html = Path(outputs["html"]).read_text(encoding="utf-8")
    assert "区域编辑器" in html
    assert "Export JSON" in html
    assert "Merge Node" in html
    assert "Fill From OCR" in html
    assert "Connect Nodes" in html
    assert 'id="json-file"' in html
    assert 'id="image-file"' in html
    assert "Run OCR For Node" in html
    assert "OCR Candidates" in html
