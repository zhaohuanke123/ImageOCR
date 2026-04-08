from __future__ import annotations

from difflib import SequenceMatcher

from shapely.geometry import Polygon

from .models import OCRBlock


def _polygon(block: OCRBlock) -> Polygon:
    return Polygon(block.bbox)


def block_iou(left: OCRBlock, right: OCRBlock) -> float:
    left_poly = _polygon(left)
    right_poly = _polygon(right)
    if not left_poly.is_valid or not right_poly.is_valid:
        return 0.0
    union = left_poly.union(right_poly).area
    if union <= 0:
        return 0.0
    return left_poly.intersection(right_poly).area / union


def text_similarity(left: str, right: str) -> float:
    return SequenceMatcher(a=left, b=right).ratio()


def merge_blocks(blocks: list[OCRBlock], iou_threshold: float = 0.3) -> list[OCRBlock]:
    ordered = sorted(blocks, key=lambda block: block.confidence, reverse=True)
    merged: list[OCRBlock] = []

    for candidate in ordered:
        duplicate = False
        for existing in merged:
            if block_iou(candidate, existing) >= iou_threshold and text_similarity(
                candidate.text, existing.text
            ) >= 0.7:
                duplicate = True
                break
        if not duplicate:
            merged.append(candidate)

    return sorted(merged, key=lambda block: (block.top, block.left))
