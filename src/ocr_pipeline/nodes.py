from __future__ import annotations

from statistics import mean

from .models import MindmapNode, OCRBlock


def _mergeable(anchor: OCRBlock, candidate: OCRBlock, distance: float, vertical_gap: float) -> bool:
    horizontal_close = abs(anchor.center_x - candidate.center_x) <= max(distance, anchor.width)
    vertical_close = abs(anchor.bottom - candidate.top) <= max(vertical_gap, anchor.height)
    overlap = min(anchor.right, candidate.right) - max(anchor.left, candidate.left)
    return horizontal_close and vertical_close and overlap >= 0


def _bbox_from_blocks(blocks: list[OCRBlock]) -> list[list[float]]:
    left = min(block.left for block in blocks)
    top = min(block.top for block in blocks)
    right = max(block.right for block in blocks)
    bottom = max(block.bottom for block in blocks)
    return [[left, top], [right, top], [right, bottom], [left, bottom]]


def build_nodes(
    blocks: list[OCRBlock], merge_distance: float, vertical_gap: float
) -> list[MindmapNode]:
    pending = sorted(blocks, key=lambda block: (block.top, block.left))
    nodes: list[MindmapNode] = []
    consumed: set[str] = set()

    for block in pending:
        if block.id in consumed:
            continue
        group = [block]
        consumed.add(block.id)
        changed = True
        while changed:
            changed = False
            for candidate in pending:
                if candidate.id in consumed:
                    continue
                if any(
                    _mergeable(member, candidate, merge_distance, vertical_gap)
                    for member in group
                ):
                    group.append(candidate)
                    consumed.add(candidate.id)
                    changed = True
        group.sort(key=lambda item: (item.top, item.left))
        lines = [item.text for item in group]
        nodes.append(
            MindmapNode(
                id=f"node_{len(nodes):04d}",
                text="\n".join(lines),
                bbox=_bbox_from_blocks(group),
                lines=lines,
                confidence=float(mean(item.confidence for item in group)),
                block_ids=[item.id for item in group],
            )
        )
    return nodes
