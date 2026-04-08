from ocr_pipeline.models import OCRBlock
from ocr_pipeline.nodes import build_nodes


def make_block(block_id: str, left: float, top: float, text: str) -> OCRBlock:
    return OCRBlock(
        id=block_id,
        text=text,
        bbox=[[left, top], [left + 120, top], [left + 120, top + 28], [left, top + 28]],
        confidence=0.9,
        tile_id="tile",
        scale=1.0,
    )


def test_build_nodes_merges_multiline_blocks() -> None:
    blocks = [
        make_block("a", 100, 100, "Core"),
        make_block("b", 102, 132, "Systems"),
        make_block("c", 500, 100, "Gameplay"),
    ]

    nodes = build_nodes(blocks, merge_distance=80, vertical_gap=40)

    assert len(nodes) == 2
    assert nodes[0].lines == ["Core", "Systems"]
