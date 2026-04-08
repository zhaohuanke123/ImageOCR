from ocr_pipeline.merge import merge_blocks
from ocr_pipeline.models import OCRBlock


def make_block(block_id: str, left: float, top: float, text: str, confidence: float) -> OCRBlock:
    return OCRBlock(
        id=block_id,
        text=text,
        bbox=[[left, top], [left + 100, top], [left + 100, top + 30], [left, top + 30]],
        confidence=confidence,
        tile_id="tile",
        scale=1.0,
    )


def test_merge_blocks_keeps_highest_confidence_duplicate() -> None:
    blocks = [
        make_block("a", 10, 10, "Renderer", 0.95),
        make_block("b", 12, 11, "Renderer", 0.80),
        make_block("c", 300, 300, "Physics", 0.90),
    ]

    merged = merge_blocks(blocks)

    assert [block.id for block in merged] == ["a", "c"]
