"""
将包含列表结构的节点拆分为父子节点层级结构

例如：
原始节点：
  text: "标题\n- 项目1\n- 项目2\n- 项目3"

拆分后：
  父节点：
    text: "标题"
    children: [子节点ID列表]
  子节点1：
    text: "项目1"
    parent_id: 父节点ID
  子节点2：
    text: "项目2"
    parent_id: 父节点ID
  ...
"""

import json
import uuid
from pathlib import Path


def generate_node_id():
    """生成唯一的节点ID"""
    return f"split_{uuid.uuid4().hex[:16]}"


def parse_list_items(text):
    """
    解析文本中的列表项

    返回: (标题, 列表项列表) 或 (None, None) 如果不是列表结构
    """
    lines = text.strip().split('\n')
    if len(lines) < 2:
        return None, None

    # 第一行是标题
    title = lines[0].strip()

    # 检查剩余行是否都是列表项（以 - 或 • 开头）
    list_items = []
    for line in lines[1:]:
        stripped = line.strip()
        if stripped.startswith('- ') or stripped.startswith('• '):
            item_text = stripped[2:].strip()  # 移除 "- " 或 "• "
            if item_text:  # 忽略空项
                list_items.append(item_text)
        elif stripped == '':
            continue  # 忽略空行
        else:
            # 有非列表项，不拆分
            return None, None

    if len(list_items) == 0:
        return None, None

    return title, list_items


def parse_nested_list_items(text):
    """
    解析嵌套列表结构

    返回: (标题, 列表项列表) 其中列表项可能包含子项
    """
    lines = text.strip().split('\n')
    if len(lines) < 2:
        return None, None

    title = lines[0].strip()

    items = []
    current_item = None
    current_subitems = []

    for line in lines[1:]:
        stripped = line.strip()

        # 计算缩进级别（通过原始行的前导空格）
        indent = len(line) - len(line.lstrip())

        if stripped.startswith('- ') or stripped.startswith('• '):
            item_text = stripped[2:].strip()

            if indent == 0:
                # 顶级列表项
                if current_item is not None:
                    items.append({
                        'text': current_item,
                        'subitems': current_subitems
                    })
                current_item = item_text
                current_subitems = []
            elif indent > 0 and current_item is not None:
                # 子项
                current_subitems.append(item_text)
        elif stripped == '':
            continue
        else:
            # 非列表项，不拆分
            return None, None

    # 添加最后一个项
    if current_item is not None:
        items.append({
            'text': current_item,
            'subitems': current_subitems
        })

    if len(items) == 0:
        return None, None

    return title, items


def split_node(node, nodes_by_id):
    """
    拆分单个节点

    返回: (更新后的节点, 新增的子节点列表) 或 (None, []) 如果不需要拆分
    """
    # 先尝试解析嵌套列表
    title, items = parse_nested_list_items(node['text'])

    if title is None:
        return None, []

    # 创建新的子节点
    new_children = []
    new_nodes = []

    for item in items:
        child_id = generate_node_id()
        child_node = {
            'id': child_id,
            'text': item['text'],
            'lines': item['text'].split('\n'),
            'bbox': node.get('bbox', [[0, 0], [0, 0], [0, 0], [0, 0]]),  # 继承父节点bbox
            'confidence': node.get('confidence', 0.9),
            'parent_id': node['id'],
            'children': [],
            'block_ids': [],
        }

        # 如果有子项，创建孙节点
        if item['subitems']:
            for subitem in item['subitems']:
                subchild_id = generate_node_id()
                subchild_node = {
                    'id': subchild_id,
                    'text': subitem,
                    'lines': subitem.split('\n'),
                    'bbox': node.get('bbox', [[0, 0], [0, 0], [0, 0], [0, 0]]),
                    'confidence': node.get('confidence', 0.9),
                    'parent_id': child_id,
                    'children': [],
                    'block_ids': [],
                }
                new_nodes.append(subchild_node)
                child_node['children'].append(subchild_id)

        new_nodes.append(child_node)
        new_children.append(child_id)

    # 更新父节点
    updated_node = {
        **node,
        'text': title,
        'lines': title.split('\n'),
        'children': new_children,
    }

    return updated_node, new_nodes


def process_graph(input_path, output_path=None):
    """处理整个图数据"""
    if output_path is None:
        output_path = input_path

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    nodes = data['nodes']
    nodes_by_id = {n['id']: n for n in nodes}

    # 统计
    total_split = 0
    total_new_nodes = 0

    # 处理每个节点
    updated_nodes = []
    new_nodes = []

    for node in nodes:
        result, children = split_node(node, nodes_by_id)
        if result:
            updated_nodes.append(result)
            new_nodes.extend(children)
            total_split += 1
            total_new_nodes += len(children)
        else:
            updated_nodes.append(node)

    # 合并所有节点
    all_nodes = updated_nodes + new_nodes

    # 更新数据
    data['nodes'] = all_nodes

    # 更新edges
    if 'edges' in data:
        for edge in data['edges']:
            # 检查源节点和目标节点是否还存在
            source_exists = any(n['id'] == edge.get('source') or n['id'] == edge.get('parent_id') for n in all_nodes)
            target_exists = any(n['id'] == edge.get('target') or n['id'] == edge.get('child_id') for n in all_nodes)

    # 保存
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"处理完成!")
    print(f"  原始节点数: {len(nodes)}")
    print(f"  拆分节点数: {total_split}")
    print(f"  新增子节点数: {total_new_nodes}")
    print(f"  最终节点数: {len(all_nodes)}")

    return data


if __name__ == '__main__':
    import sys

    input_file = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/graph.json'
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file

    process_graph(input_file, output_file)
