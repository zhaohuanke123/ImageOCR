"""重新排序 Game Engine 根节点的 children 数组"""

import json
from pathlib import Path

# 配置期望顺序（严格匹配节点 text 字段）
DESIRED_ORDER = [
    "渲染",
    "动画系统",
    "物理系统",
    "音效",
    "工具链",
    "GamePlay",
    "网络",
    "面向数据编程与任务系统",
]

def main():
    # 路径
    graph_path = Path(__file__).parent.parent / "artifacts" / "graph.json"
    outline_path = Path(__file__).parent.parent / "artifacts" / "mindmap_outline.md"

    # 1. 读取 graph.json
    with open(graph_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    nodes = data["nodes"]

    # 2. 构建节点ID到名称的映射，以及名称到ID的映射
    id_to_name = {n["id"]: n["text"] for n in nodes}
    name_to_id = {n["text"]: n["id"] for n in nodes}

    # 3. 找到根节点（parent_id: null）
    root = None
    for node in nodes:
        if node.get("parent_id") is None:
            root = node
            break

    if not root:
        print("未找到根节点！")
        return

    print(f"根节点: {root['text']}")
    print(f"当前 children 顺序:")
    for cid in root["children"]:
        print(f"  - {id_to_name.get(cid, cid)}")

    # 4. 按 DESIRED_ORDER 重排 children
    new_children = []
    for name in DESIRED_ORDER:
        if name in name_to_id:
            node_id = name_to_id[name]
            if node_id in root["children"]:
                new_children.append(node_id)
            else:
                print(f"警告: 节点 '{name}' 不在当前 children 中")
        else:
            print(f"警告: 未找到名称为 '{name}' 的节点")

    # 检查是否有遗漏的节点
    missing = set(root["children"]) - set(new_children)
    if missing:
        print(f"警告: 以下节点未被包含在新顺序中，将追加到末尾:")
        for mid in missing:
            print(f"  - {id_to_name.get(mid, mid)}")
        new_children.extend(missing)

    # 更新 children
    root["children"] = new_children

    print(f"\n新 children 顺序:")
    for cid in root["children"]:
        print(f"  - {id_to_name.get(cid, cid)}")

    # 5. 保存 graph.json
    with open(graph_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n已保存到 {graph_path}")

    # 6. 重新生成 outline
    from ocr_pipeline.export import export_outline
    from ocr_pipeline.config import load_config

    config_path = Path(__file__).parent.parent / "config.yaml"
    config = load_config(config_path)
    export_outline(data, config)
    print(f"已重新生成 {outline_path}")

if __name__ == "__main__":
    main()
