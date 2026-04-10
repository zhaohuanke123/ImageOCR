import json

with open('artifacts/graph.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = data['nodes']
nodes_by_id = {n['id']: n for n in nodes}

# Find cycles: A is parent of B, and B is parent of A
cycles = []
for node in nodes:
    node_id = node['id']
    children = node.get('children', [])
    for child_id in children:
        child = nodes_by_id.get(child_id)
        if child and node_id in child.get('children', []):
            cycles.append((node_id, child_id))

print(f'Found {len(cycles)} cycle(s):')
for parent_id, child_id in cycles:
    print(f'  {parent_id} <-> {child_id}')
    # Remove the child's reference to parent (keep only parent->child)
    child = nodes_by_id[child_id]
    if parent_id in child.get('children', []):
        child['children'].remove(parent_id)
        print(f'    Removed {parent_id} from {child_id} children')

# Save fixed data
with open('artifacts/graph.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\nFixed {len(cycles)} cycle(s)!')
