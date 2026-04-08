from ocr_pipeline.graph import build_graph
from ocr_pipeline.models import MindmapNode


def make_node(node_id: str, left: float, top: float, text: str) -> MindmapNode:
    return MindmapNode(
        id=node_id,
        text=text,
        bbox=[[left, top], [left + 150, top], [left + 150, top + 40], [left, top + 40]],
        lines=[text],
        confidence=0.9,
    )


def test_build_graph_links_left_to_right_nodes() -> None:
    nodes = [
        make_node("root", 100, 100, "Engine"),
        make_node("child_a", 400, 90, "Render"),
        make_node("child_b", 420, 160, "Physics"),
    ]

    graph = build_graph(
        nodes,
        max_parent_distance=1000,
        horizontal_bias=0.7,
        vertical_tolerance=120,
    )

    assert graph["roots"] == ["root"]
    parents = {node["id"]: node["parent_id"] for node in graph["nodes"]}
    assert parents["child_a"] == "root"
    assert parents["child_b"] == "root"
