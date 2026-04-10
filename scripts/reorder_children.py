"""重新排序节点的 children 数组（支持多层）"""

import json
from pathlib import Path

# 第2层节点顺序
L2_ORDER = [
    "基础架构",
    "渲染",
    "动画系统",
    "物理系统",
    "音效",
    "工具链",
    "GamePlay",
    "网络",
    "面向数据编程与任务系统",
]

# 第3层节点顺序（按第2层分组）
L3_ORDER = {
    "渲染": [
        "GPU架构",
        "可见性裁剪",
        "贴图压缩",
        "Frame Graph（帧图）",
        "渲染系统",
        "Lumen",
        "Nanite",
    ],
    "动画系统": [
        "动画技术基础",
        "动画技术进阶",
        "补充",
    ],
    "物理系统": [
        "物理系统基础概念",
        "物理系统应用",
    ],
    "音效": [
        "声音基础",
        "音频",
    ],
    "工具链": [
        "软件架构",
        "数据结构设计",
        "鲁棒性设计",
        "C++代码反射",
        "插件系统",
        "界面（GUI）",
        "常见编辑器 - World Editor",
        "资产管理",
        "协同编辑",
    ],
    "GamePlay": [
        "复杂的游戏性及其基本要素",
        "基础AI系统",
        "构建高级的AI系统",
        "AI Planning（AI规划）",
    ],
    "网络": [
        "网络基础",
        "服务器架构",
        "网络同步",
        "游戏网络优化",
    ],
    "面向数据编程与任务系统": [
        "并行编程基础知识",
        "面向数据编程",
        "实体-组件-系统（ECS）",
        "基础架构",
        "游戏引擎并行框架",
    ],
}


def reorder_children(children: list, id_to_name: dict, desired_order: list) -> list:
    """按期望顺序重排 children 数组"""
    name_to_id = {id_to_name[cid]: cid for cid in children if cid in id_to_name}

    new_children = []
    for name in desired_order:
        if name in name_to_id:
            new_children.append(name_to_id[name])

    # 添加未在期望顺序中的节点（追加到末尾）
    missing = set(children) - set(new_children)
    new_children.extend(missing)

    return new_children


def main():
    graph_path = Path(__file__).parent.parent / "artifacts" / "graph.json"
    outline_path = Path(__file__).parent.parent / "artifacts" / "mindmap_outline.md"

    with open(graph_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    nodes = data["nodes"]
    id_to_name = {n["id"]: n["text"] for n in nodes}
    name_to_id = {n["text"]: n["id"] for n in nodes}

    # 找到根节点
    root = next((n for n in nodes if n.get("parent_id") is None), None)
    if not root:
        print("未找到根节点！")
        return

    print(f"根节点: {root['text']}")

    # 1. 重排第2层
    print("\n=== 重排第2层 ===")
    root["children"] = reorder_children(root["children"], id_to_name, L2_ORDER)
    print(f"新顺序: {[id_to_name.get(cid, cid) for cid in root['children']]}")

    # 2. 重排第3层
    print("\n=== 重排第3层 ===")
    for l2_id in root["children"]:
        l2_node = next((n for n in nodes if n["id"] == l2_id), None)
        if not l2_node:
            continue

        l2_name = l2_node["text"]
        if l2_name not in L3_ORDER:
            print(f"  {l2_name}: 无配置，跳过")
            continue

        l2_node["children"] = reorder_children(
            l2_node["children"], id_to_name, L3_ORDER[l2_name]
        )
        print(f"  {l2_name}: {[id_to_name.get(cid, cid) for cid in l2_node['children']]}")

    # 保存 graph.json
    with open(graph_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n已保存到 {graph_path}")

    # 重新生成 outline
    from ocr_pipeline.export import export_outline
    from ocr_pipeline.config import load_config

    config_path = Path(__file__).parent.parent / "config.yaml"
    config = load_config(config_path)
    export_outline(data, config)
    print(f"已重新生成 {outline_path}")


if __name__ == "__main__":
    main()
