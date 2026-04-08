from __future__ import annotations

from math import hypot

from .models import MindmapEdge, MindmapNode


def _edge_score(
    parent: MindmapNode,
    child: MindmapNode,
    max_distance: float,
    horizontal_bias: float,
    vertical_tolerance: float,
) -> tuple[float, str] | None:
    dx = child.center_x - parent.center_x
    dy = abs(child.center_y - parent.center_y)
    if dx <= 0:
        return None
    min_horizontal_separation = max(
        40.0,
        min(parent.right - parent.left, child.right - child.left) * 0.5,
    )
    if dx < min_horizontal_separation:
        return None
    distance = hypot(dx, dy)
    if distance > max_distance or dy > vertical_tolerance * 3:
        return None
    horizontal_score = max(0.0, 1.0 - dx / max_distance)
    vertical_score = max(0.0, 1.0 - dy / max(vertical_tolerance, 1.0))
    size_score = max(0.0, min(1.0, parent.confidence))
    score = (
        horizontal_score * horizontal_bias
        + vertical_score * (1 - horizontal_bias)
        + 0.1 * size_score
    )
    return score, f"dx={dx:.1f}, dy={dy:.1f}"


def build_graph(
    nodes: list[MindmapNode],
    max_parent_distance: float,
    horizontal_bias: float,
    vertical_tolerance: float,
) -> dict:
    ordered = sorted(nodes, key=lambda node: node.center_x)
    edges: list[MindmapEdge] = []
    parent_map: dict[str, str | None] = {node.id: None for node in ordered}

    for child in ordered:
        best: tuple[float, MindmapNode, str] | None = None
        for parent in ordered:
            if parent.id == child.id:
                continue
            scored = _edge_score(
                parent,
                child,
                max_distance=max_parent_distance,
                horizontal_bias=horizontal_bias,
                vertical_tolerance=vertical_tolerance,
            )
            if not scored:
                continue
            score, reason = scored
            if best is None or score > best[0]:
                best = (score, parent, reason)
        if best is None:
            continue
        score, parent, reason = best
        parent_map[child.id] = parent.id
        edges.append(
            MindmapEdge(parent_id=parent.id, child_id=child.id, score=score, reason=reason)
        )

    roots = [node.id for node in ordered if parent_map[node.id] is None]
    children_map: dict[str, list[str]] = {node.id: [] for node in ordered}
    for edge in edges:
        children_map[edge.parent_id].append(edge.child_id)

    return {
        "nodes": [
            {
                **node.to_dict(),
                "parent_id": parent_map[node.id],
                "children": children_map[node.id],
            }
            for node in ordered
        ],
        "edges": [edge.to_dict() for edge in edges],
        "roots": roots,
    }
