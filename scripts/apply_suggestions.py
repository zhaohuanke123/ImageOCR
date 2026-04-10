import json

# Load suggestions
with open('artifacts/ai_refine_suggestions.json', 'r', encoding='utf-8') as f:
    suggestions_data = json.load(f)

# Load graph
with open('artifacts/graph.json', 'r', encoding='utf-8') as f:
    graph_data = json.load(f)

# Build node lookup
nodes_by_id = {n['id']: n for n in graph_data['nodes']}

# Apply all suggestions
applied = 0
not_found = []

for suggestion in suggestions_data['suggestions']:
    node_id = suggestion['node_id']
    suggested_text = suggestion['suggested_text']

    if node_id in nodes_by_id:
        node = nodes_by_id[node_id]
        node['text'] = suggested_text
        node['lines'] = suggested_text.split('\n')
        applied += 1
    else:
        not_found.append(node_id)

# Save updated graph
with open('artifacts/graph.json', 'w', encoding='utf-8') as f:
    json.dump(graph_data, f, ensure_ascii=False, indent=2)

print(f"Applied {applied} suggestions to graph.json")
if not_found:
    print(f"Nodes not found: {not_found}")
