from __future__ import annotations

import csv
import json
import math
import re
from pathlib import Path
from statistics import mean
from typing import Any

from PIL import Image

from .config import AppConfig
from .io_utils import ensure_dir, read_json, read_jsonl, write_json, write_text

ASCII_TOKEN_PATTERN = re.compile(r"[A-Za-z]{12,}")


def load_blocks(path: str | Path) -> list[dict[str, Any]]:
    target = Path(path)
    return read_jsonl(target) if target.suffix == ".jsonl" else list(read_json(target))


def node_bounds(node: dict[str, Any]) -> tuple[float, float, float, float]:
    xs = [point[0] for point in node["bbox"]]
    ys = [point[1] for point in node["bbox"]]
    return min(xs), min(ys), max(xs), max(ys)


def node_center(node: dict[str, Any]) -> tuple[float, float]:
    left, top, right, bottom = node_bounds(node)
    return (left + right) / 2, (top + bottom) / 2


def detect_review_issues(graph_payload: dict[str, Any], config: AppConfig) -> list[dict[str, Any]]:
    nodes = graph_payload.get("nodes", [])
    edges = graph_payload.get("edges", [])
    issues: list[dict[str, Any]] = []

    for node in nodes:
        left, top, right, bottom = node_bounds(node)
        height = bottom - top
        width = right - left
        area = width * height
        text = node.get("text", "")
        lines = node.get("lines", [])
        confidence = float(node.get("confidence", 0.0))

        if node.get("parent_id") is None:
            issues.append({"issue_type": "orphan_root", "node_id": node["id"], "text": text, "reason": "node has no parent", "bbox": node["bbox"]})
        if confidence < config.review_low_confidence_threshold:
            issues.append({"issue_type": "low_confidence_node", "node_id": node["id"], "text": text, "reason": f"confidence={confidence:.3f}", "bbox": node["bbox"]})
        if len(lines) >= config.review_oversized_lines_threshold or height >= config.review_oversized_height_threshold:
            issues.append({"issue_type": "oversized_node", "node_id": node["id"], "text": text, "reason": f"lines={len(lines)}, height={height:.1f}", "bbox": node["bbox"]})
        if not node.get("children") and area >= 120000:
            issues.append({"issue_type": "oversized_leaf", "node_id": node["id"], "text": text, "reason": f"area={area:.1f}", "bbox": node["bbox"]})
        compact = "".join(text.split())
        if (len(compact) >= 30 and " " not in text and "\n" not in text) or ASCII_TOKEN_PATTERN.search(compact):
            issues.append({"issue_type": "text_outlier", "node_id": node["id"], "text": text, "reason": "suspicious long token or unbroken text", "bbox": node["bbox"]})

    centers = {node["id"]: node_center(node) for node in nodes}
    for node in nodes:
        cx, cy = centers[node["id"]]
        neighbors = 0
        for other in nodes:
            if other["id"] == node["id"]:
                continue
            ox, oy = centers[other["id"]]
            if math.hypot(cx - ox, cy - oy) <= config.review_dense_region_radius:
                neighbors += 1
        if neighbors >= config.review_dense_region_neighbor_threshold:
            issues.append({"issue_type": "dense_overlap_region", "node_id": node["id"], "text": node["text"], "reason": f"neighbors={neighbors}", "bbox": node["bbox"]})

    nodes_by_id = {node["id"]: node for node in nodes}
    for edge in edges:
        score = float(edge.get("score", 0.0))
        if score < config.review_weak_edge_threshold:
            child = nodes_by_id.get(edge["child_id"])
            issues.append({"issue_type": "weak_edge", "node_id": edge["child_id"], "text": child["text"] if child else edge["child_id"], "reason": f"parent={edge['parent_id']}, score={score:.3f}", "bbox": child["bbox"] if child else []})

    unique: dict[tuple[str, str, str], dict[str, Any]] = {}
    for issue in issues:
        unique[(issue["issue_type"], issue["node_id"], issue["reason"])] = issue
    return sorted(unique.values(), key=lambda item: (item["issue_type"], item["node_id"], item["reason"]))


def review_summary(graph_payload: dict[str, Any], issues: list[dict[str, Any]]) -> dict[str, Any]:
    nodes = graph_payload.get("nodes", [])
    return {
        "node_count": len(nodes),
        "edge_count": len(graph_payload.get("edges", [])),
        "root_count": len(graph_payload.get("roots", [])),
        "issue_count": len(issues),
        "average_confidence": round(mean(node["confidence"] for node in nodes), 4) if nodes else 0.0,
    }


def _html_template(data: dict[str, Any]) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"""<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>OCR Review</title><style>
body{{margin:0;font-family:"Segoe UI","PingFang SC",sans-serif;background:#f4efe5;color:#201b16}}.layout{{display:grid;grid-template-columns:380px 1fr;height:100vh}}.sidebar{{overflow:auto;padding:16px;border-right:1px solid #d8d1c1;background:#fffdf8}}.viewer{{position:relative;overflow:hidden;background:#d6dfdb}}.summary{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}.card,.item{{background:#fffdf8;border:1px solid #d8d1c1;border-radius:12px;padding:10px}}.item{{cursor:pointer;margin-bottom:8px}}.item.active{{border-color:#0f766e}}input,select{{width:100%;padding:8px 10px;border:1px solid #d8d1c1;border-radius:10px}}label{{display:flex;gap:8px;align-items:center;margin:6px 0}}.shell{{position:absolute;inset:0;overflow:auto;cursor:grab}}.shell.dragging{{cursor:grabbing}}.stage{{position:relative;transform-origin:top left}}.stage img{{display:block;max-width:none}}.overlay{{position:absolute;inset:0}}.toolbar{{position:absolute;top:12px;left:12px;z-index:10;background:#fffdf8;border:1px solid #d8d1c1;border-radius:12px;padding:10px}}pre{{white-space:pre-wrap;font-size:12px}}
/* Tree Node Styles */
.tree-node{{user-select:none}}.tree-node-item{{display:flex;align-items:center;gap:4px;padding:6px 8px;border:1px solid transparent;border-radius:8px;cursor:pointer;transition:all .1s;margin-bottom:1px}}.tree-node-item:hover{{background:#f0ebe3;border-color:#d8d1c1}}.tree-node-item.selected{{background:#e8f4f2;border-color:#0f766e}}.tree-toggle{{flex-shrink:0;width:16px;height:16px;display:flex;align-items:center;justify-content:center;color:#75695f;cursor:pointer;visibility:hidden}}.tree-toggle.has-children{{visibility:visible}}.tree-toggle.expanded{{transform:rotate(90deg)}}.tree-toggle svg{{width:10px;height:10px}}.tree-indent{{display:flex;flex-shrink:0}}.tree-indent-unit{{width:12px;flex-shrink:0}}.tree-children{{overflow:hidden;transition:max-height .2s}}.tree-children.collapsed{{max-height:0!important}}.tree-icon{{flex-shrink:0;width:14px;height:14px;color:#0f766e}}.tree-icon.folder{{color:#b45309}}.tree-icon.leaf{{color:#75695f}}.tree-content{{flex:1;min-width:0;display:flex;align-items:center;gap:6px}}.tree-text{{font-size:13px;color:#201b16;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}}.tree-text.highlight{{background:#fef3c7;color:#92400e;padding:0 2px;border-radius:2px}}.tree-conf{{font-size:11px;color:#75695f;flex-shrink:0}}.tree-actions{{display:flex;align-items:center;gap:2px;opacity:0;transition:opacity .1s}}.tree-node-item:hover .tree-actions{{opacity:1}}.tree-level-0 .tree-text{{font-weight:600}}.tree-level-1 .tree-text{{font-weight:400}}.tree-level-2 .tree-text{{font-size:12px}}.section-header{{display:flex;align-items:center;justify-content:space-between;margin:16px 0 8px}}.section-title{{font-size:13px;color:#75695f;text-transform:uppercase;letter-spacing:.08em;margin:0}}.section-count{{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;font-size:11px;font-weight:500;color:#fff;background:#0f766e;border-radius:999px}}.section-count.has-issues{{background:#f59e0b}}.node-tree-container{{max-height:300px;overflow-y:auto;border:1px solid #d8d1c1;border-radius:10px;padding:8px;background:#fff}}.node-tree-empty{{padding:16px;text-align:center;color:#75695f;font-size:13px}}
/* Issue Section */
.issue-section{{border:1px solid #d8d1c1;border-radius:12px;margin-bottom:12px;overflow:hidden;background:#fffdf8}}.issue-header{{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f5f0e6;cursor:pointer;user-select:none;border-bottom:1px solid #d8d1c1;transition:background .15s}}.issue-header:hover{{background:#ebe5d8}}.issue-header.collapsed{{border-bottom:none}}.issue-header-left{{display:flex;align-items:center;gap:8px}}.issue-toggle{{width:16px;height:16px;color:#75695f;transition:transform .15s ease}}.issue-header.collapsed .issue-toggle{{transform:rotate(-90deg)}}.issue-title{{font-weight:600;font-size:14px;color:#1c1917}}.issue-filters{{display:flex;align-items:center;gap:4px;padding:8px 10px;background:#fffdf8;border-bottom:1px solid #d8d1c1;overflow-x:auto;flex-wrap:wrap}}.issue-filters.collapsed{{display:none}}.issue-filter-btn{{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;font-size:11px;font-weight:500;color:#57534e;background:#f5f0e6;border:1px solid transparent;border-radius:16px;cursor:pointer;transition:all .15s ease;white-space:nowrap}}.issue-filter-btn:hover{{background:#ebe5d8}}.issue-filter-btn.active{{background:#0f766e;color:#fff}}.filter-dot{{width:6px;height:6px;border-radius:50%;flex-shrink:0}}.filter-dot.orphan_root,.filter-dot.orphan{{background:#ef4444}}.filter-dot.low_confidence_node,.filter-dot.low_conf{{background:#f59e0b}}.filter-dot.weak_edge{{background:#f59e0b}}.filter-dot.oversized_node,.filter-dot.oversized_leaf{{background:#f97316}}.filter-dot.text_outlier,.filter-dot.dense_overlap_region,.filter-dot.other{{background:#6b7280}}.filter-count{{min-width:14px;height:14px;padding:0 3px;font-size:9px;font-weight:700;color:#57534e;background:#fff;border-radius:8px;text-align:center}}.issue-filter-btn.active .filter-count{{background:rgba(255,255,255,.3);color:#fff}}.issue-list-container{{max-height:250px;overflow-y:auto;padding:8px}}.issue-list-container.collapsed{{display:none}}.issue-item{{display:flex;align-items:flex-start;gap:8px;padding:10px;margin-bottom:6px;background:#fffdf8;border:1px solid #d8d1c1;border-left:3px solid #d8d1c1;border-radius:8px;cursor:pointer;transition:all .15s ease}}.issue-item:hover{{background:#f5f0e6;box-shadow:0 1px 3px rgba(0,0,0,.08)}}.issue-item.active{{background:#e8f5f3;border-color:#0f766e}}.issue-item.orphan_root{{border-left-color:#ef4444}}.issue-item.low_confidence_node{{border-left-color:#f59e0b}}.issue-item.weak_edge{{border-left-color:#f59e0b}}.issue-item.oversized_node,.issue-item.oversized_leaf{{border-left-color:#f97316}}.issue-item.text_outlier,.issue-item.dense_overlap_region{{border-left-color:#6b7280}}.issue-icon{{flex-shrink:0;width:18px;height:18px;display:flex;align-items:center;justify-content:center}}.issue-icon svg{{width:16px;height:16px}}.issue-icon.orphan_root svg{{color:#ef4444}}.issue-icon.low_confidence_node svg{{color:#f59e0b}}.issue-icon.weak_edge svg{{color:#f59e0b}}.issue-icon.oversized_node svg,.issue-icon.oversized_leaf svg{{color:#f97316}}.issue-icon.text_outlier svg,.issue-icon.dense_overlap_region svg{{color:#6b7280}}.issue-content{{flex:1;min-width:0}}.issue-type{{font-size:11px;font-weight:600;color:#57534e;margin-bottom:2px}}.issue-text{{font-size:12px;color:#1c1917;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}.issue-reason{{font-size:10px;color:#78716c;margin-top:2px}}.issue-action{{flex-shrink:0;opacity:0;transition:opacity .15s ease}}.issue-item:hover .issue-action{{opacity:1}}.locate-btn{{width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:6px;cursor:pointer;color:#78716c;transition:all .15s ease}}.locate-btn:hover{{background:#0f766e;color:#fff}}.issue-empty{{padding:16px;text-align:center;color:#a8a29e}}.issue-empty-icon{{width:32px;height:32px;margin-bottom:8px;opacity:.5}}
</style></head>
<body><div class="layout"><aside class="sidebar"><h1>OCR 复核器</h1><div class="summary" id="summary"></div><h2>筛选</h2><input id="search" type="search" placeholder="搜索文本"><label><input id="show-blocks" type="checkbox">显示 OCR blocks</label><label><input id="show-nodes" type="checkbox" checked>显示 nodes</label><label><input id="show-edges" type="checkbox">显示 edges</label><label><input id="roots-only" type="checkbox">只看 roots</label><label><input id="low-only" type="checkbox">只看低置信节点</label>
<div class="issue-section"><div class="issue-header" id="issue-header"><div class="issue-header-left"><svg class="issue-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg><span class="issue-title">问题列表</span><span class="section-count" id="issue-count">0</span></div></div><div class="issue-filters" id="issue-filters"></div><div class="issue-list-container" id="issue-list-container"></div></div>
<div class="section-header"><h2 class="section-title">节点树</h2><span class="section-count" id="node-count">0</span></div><div class="node-tree-container" id="node-tree"></div>
<h2>节点详情</h2><div class="card"><pre id="detail">点击节点或问题项查看详情</pre></div></aside><main class="viewer"><div class="toolbar"><label>缩放 <input id="zoom" type="range" min="20" max="200" value="60"><span id="zoom-value">60%</span></label></div><div class="shell" id="shell"><div class="stage" id="stage"><img id="image"><svg class="overlay" id="overlay"></svg></div></div></main></div>
<script id="review-data" type="application/json">{payload}</script><script>
const data=JSON.parse(document.getElementById("review-data").textContent);
const nodeById=Object.fromEntries(data.nodes.map(n=>[n.id,n]));
const childrenMap={{}};
data.nodes.forEach(n=>{{childrenMap[n.id]=n.children||[]}});
const state={{scale:.6,selectedId:null,search:"",issueType:"all",showBlocks:false,showNodes:true,showEdges:false,rootsOnly:false,lowOnly:false,expandedNodes:new Set(data.nodes.filter(n=>!n.parent_id).map(n=>n.id)),issueSectionExpanded:true}};
const image=document.getElementById("image"),stage=document.getElementById("stage"),overlay=document.getElementById("overlay"),shell=document.getElementById("shell"),detail=document.getElementById("detail"),issueListContainer=document.getElementById("issue-list-container"),issueHeader=document.getElementById("issue-header"),issueCount=document.getElementById("issue-count"),issueFilters=document.getElementById("issue-filters"),nodeTree=document.getElementById("node-tree");
image.src=data.image_src;image.width=data.image_width;image.height=data.image_height;
overlay.setAttribute("viewBox",`0 0 ${{data.image_width}} ${{data.image_height}}`);overlay.setAttribute("width",data.image_width);overlay.setAttribute("height",data.image_height);
stage.style.width=`${{data.image_width}}px`;stage.style.height=`${{data.image_height}}px`;

function applyScale(){{stage.style.transform=`scale(${{state.scale}})`;document.getElementById("zoom-value").textContent=`${{Math.round(state.scale*100)}}%`;}}
function matches(text){{return !state.search||text.toLowerCase().includes(state.search.toLowerCase());}}
function visibleNode(node){{if(state.rootsOnly&&node.parent_id)return false;if(state.lowOnly&&node.confidence>=data.thresholds.low_confidence)return false;return matches(node.text);}}
function bboxPath(bbox){{return bbox.map((p,i)=>`${{i===0?"M":"L"}}${{p[0]}},${{p[1]}}`).join(" ")+" Z";}}
function renderSummary(){{const items=[["Nodes",data.summary.node_count],["Edges",data.summary.edge_count],["Roots",data.summary.root_count],["Issues",data.summary.issue_count]];document.getElementById("summary").innerHTML=items.map(([k,v])=>`<div class="card"><div>${{k}}</div><strong>${{v}}</strong></div>`).join("");}}
function center(node){{const cx=(node.bbox[0][0]+node.bbox[2][0])/2*state.scale,cy=(node.bbox[0][1]+node.bbox[2][1])/2*state.scale;shell.scrollLeft=Math.max(0,cx-shell.clientWidth/2);shell.scrollTop=Math.max(0,cy-shell.clientHeight/2);}}
function selectNode(nodeId){{state.selectedId=nodeId;const node=nodeById[nodeId];if(!node)return;detail.textContent=JSON.stringify(node,null,2);center(node);renderIssues();renderNodeTree();renderOverlay();}}

// Tree rendering
function renderNodeTree(){{const roots=data.nodes.filter(n=>!n.parent_id);document.getElementById("node-count").textContent=data.nodes.length;let html="";function renderNode(node,level){{const children=childrenMap[node.id]||[];const hasChildren=children.length>0;const expanded=state.expandedNodes.has(node.id);const selected=state.selectedId===node.id;const visible=visibleNode(node);if(!visible&&state.search)return"";const indent='<span class="tree-indent">'+Array(level).fill('<span class="tree-indent-unit"></span>').join("")+"</span>";const toggleIcon=hasChildren?`<span class="tree-toggle ${{hasChildren?"has-children":""}} ${{expanded?"expanded":""}}" data-node="${{node.id}}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>`:'<span class="tree-toggle"></span>';const nodeIcon=hasChildren?`<svg class="tree-icon folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`:`<svg class="tree-icon leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;const conf=(node.confidence*100).toFixed(0)+"%";const textHtml=state.search?highlightText(node.text,state.search):escapeHtml(node.text);let childHtml="";if(hasChildren){{const childItems=children.map(cid=>renderNode(nodeById[cid],level+1)).filter(Boolean).join("");if(childItems)childHtml=`<div class="tree-children ${{expanded?"":"collapsed"}}" data-parent="${{node.id}}">${{childItems}}</div>`;}}return`<div class="tree-node tree-level-${{level}}" data-node="${{node.id}}" data-level="${{level}}"><div class="tree-node-item ${{selected?"selected":""}}" data-node="${{node.id}}">${{indent}}${{toggleIcon}}${{nodeIcon}}<div class="tree-content"><span class="tree-text">${{textHtml}}</span><span class="tree-conf">${{conf}}</span></div></div>${{childHtml}}</div>`;}}roots.forEach(root=>{{html+=renderNode(root,0);}});if(!html)html='<div class="node-tree-empty">'+(state.search?"未找到匹配节点":"暂无节点数据")+"</div>";nodeTree.innerHTML=html;attachTreeEvents();}}
function highlightText(text,search){{if(!search)return escapeHtml(text);const escaped=escapeHtml(text);const pattern=new RegExp(`(${{escapeRegex(search)}})`,"gi");return escaped.replace(pattern,'<span class="highlight">$1</span>');}}
function escapeHtml(text){{const div=document.createElement("div");div.textContent=text;return div.innerHTML;}}
function escapeRegex(str){{return str.replace(/[.*+?^${{}}()|[\\]\\\\]/g,"\\\\$&");}}
function attachTreeEvents(){{nodeTree.querySelectorAll(".tree-toggle").forEach(el=>{{el.addEventListener("click",e=>{{e.stopPropagation();const nodeId=el.dataset.node;if(state.expandedNodes.has(nodeId))state.expandedNodes.delete(nodeId);else state.expandedNodes.add(nodeId);renderNodeTree();}});}});nodeTree.querySelectorAll(".tree-node-item").forEach(el=>{{el.addEventListener("click",()=>selectNode(el.dataset.node));}});}}

function renderIssues(){{const filtered=data.issues.filter(issue=>(state.issueType==="all"||issue.issue_type===state.issueType)&&matches(issue.text));issueCount.textContent=filtered.length;issueCount.classList.toggle("has-issues",filtered.length>0);if(filtered.length===0){{issueListContainer.innerHTML='<div class="issue-empty"><svg class="issue-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg><div>无待处理问题</div></div>';return;}}let html="";const issueIcons={{{{orphan_root:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',low_confidence_node:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',weak_edge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/></svg>',oversized_node:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',oversized_leaf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',text_outlier:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>',dense_overlap_region:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/></svg>'}}}};const issueLabels={{{{orphan_root:"孤立节点",low_confidence_node:"低置信度",weak_edge:"弱连接",oversized_node:"超大节点",oversized_leaf:"超大叶节点",text_outlier:"文本异常",dense_overlap_region:"密集区域"}}}};for(const issue of filtered){{const icon=issueIcons[issue.issue_type]||issueIcons.text_outlier;const label=issueLabels[issue.issue_type]||issue.issue_type;const active=state.selectedId===issue.node_id;html+=`<div class="issue-item ${{issue.issue_type}} ${{active?"active":""}}" data-node="${{issue.node_id}}"><div class="issue-icon ${{issue.issue_type}}">${{icon}}</div><div class="issue-content"><div class="issue-type">${{label}}</div><div class="issue-text">${{escapeHtml(issue.text)}}</div><div class="issue-reason">${{escapeHtml(issue.reason)}}</div></div><div class="issue-action"><button class="locate-btn" title="定位"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></button></div></div>`;}}issueListContainer.innerHTML=html;for(const el of issueListContainer.querySelectorAll("[data-node]"))el.addEventListener("click",()=>selectNode(el.dataset.node));}}
function renderIssueFilters(){{const stats={{all:data.issues.length}};for(const issue of data.issues){{const t=issue.issue_type;stats[t]=(stats[t]||0)+1;}}const types=[...new Set(data.issues.map(i=>i.issue_type))].sort();let html=`<button class="issue-filter-btn ${{state.issueType==="all"?"active":""}}" data-type="all"><span>全部</span><span class="filter-count">${{stats.all}}</span></button>`;const issueLabels={{{{orphan_root:"孤立节点",low_confidence_node:"低置信度",weak_edge:"弱连接",oversized_node:"超大节点",oversized_leaf:"超大叶节点",text_outlier:"文本异常",dense_overlap_region:"密集区域"}}}};for(const t of types){{const label=issueLabels[t]||t;html+=`<button class="issue-filter-btn ${{state.issueType===t?"active":""}}" data-type="${{t}}"><span class="filter-dot ${{t}}"></span><span>${{label}}</span><span class="filter-count">${{stats[t]||0}}</span></button>`;}}issueFilters.innerHTML=html;for(const btn of issueFilters.querySelectorAll(".issue-filter-btn"))btn.addEventListener("click",()=>{{state.issueType=btn.dataset.type;renderIssueFilters();renderIssues();}});}}
issueHeader.addEventListener("click",()=>{{state.issueSectionExpanded=!state.issueSectionExpanded;issueHeader.classList.toggle("collapsed",!state.issueSectionExpanded);issueFilters.classList.toggle("collapsed",!state.issueSectionExpanded);issueListContainer.classList.toggle("collapsed",!state.issueSectionExpanded);}});
function renderOverlay(){{const parts=[];if(state.showEdges)for(const edge of data.edges){{const p=nodeById[edge.parent_id],c=nodeById[edge.child_id];if(!p||!c||!visibleNode(p)||!visibleNode(c))continue;const px=(p.bbox[0][0]+p.bbox[2][0])/2,py=(p.bbox[0][1]+p.bbox[2][1])/2,cx=(c.bbox[0][0]+c.bbox[2][0])/2,cy=(c.bbox[0][1]+c.bbox[2][1])/2;parts.push(`<line x1="${{px}}" y1="${{py}}" x2="${{cx}}" y2="${{cy}}" stroke="rgba(22,163,74,.55)" stroke-width="2"/>`);}}if(state.showBlocks)for(const block of data.blocks){{if(!matches(block.text))continue;parts.push(`<path d="${{bboxPath(block.bbox)}}" fill="rgba(37,99,235,.08)" stroke="rgba(37,99,235,.55)" stroke-width="1"/>`);}}if(state.showNodes)for(const node of data.nodes){{if(!visibleNode(node))continue;const selected=state.selectedId===node.id;parts.push(`<path data-node="${{node.id}}" d="${{bboxPath(node.bbox)}}" fill="${{selected?"rgba(245,158,11,.25)":"rgba(220,38,38,.08)"}}" stroke="${{selected?"rgba(245,158,11,.95)":"rgba(220,38,38,.85)"}}" stroke-width="${{selected?4:2}}"/>`);}}overlay.innerHTML=parts.join("");for(const el of overlay.querySelectorAll("[data-node]"))el.addEventListener("click",()=>selectNode(el.dataset.node));}}

document.getElementById("search").addEventListener("input",e=>{{state.search=e.target.value;renderIssues();renderNodeTree();renderOverlay();}});
document.getElementById("show-blocks").addEventListener("change",e=>{{state.showBlocks=e.target.checked;renderOverlay();}});
document.getElementById("show-nodes").addEventListener("change",e=>{{state.showNodes=e.target.checked;renderOverlay();}});
document.getElementById("show-edges").addEventListener("change",e=>{{state.showEdges=e.target.checked;renderOverlay();}});
document.getElementById("roots-only").addEventListener("change",e=>{{state.rootsOnly=e.target.checked;renderNodeTree();renderOverlay();}});
document.getElementById("low-only").addEventListener("change",e=>{{state.lowOnly=e.target.checked;renderNodeTree();renderOverlay();}});
document.getElementById("zoom").addEventListener("input",e=>{{state.scale=Number(e.target.value)/100;applyScale();}});
let drag=null;shell.addEventListener("mousedown",e=>{{drag={{x:e.clientX,y:e.clientY,left:shell.scrollLeft,top:shell.scrollTop}};shell.classList.add("dragging");}});
window.addEventListener("mousemove",e=>{{if(!drag)return;shell.scrollLeft=drag.left-(e.clientX-drag.x);shell.scrollTop=drag.top-(e.clientY-drag.y);}});
window.addEventListener("mouseup",()=>{{drag=null;shell.classList.remove("dragging");}});
renderSummary();applyScale();renderIssueFilters();renderIssues();renderNodeTree();renderOverlay();
</script></body></html>"""


def build_review_bundle(image_path: str | Path, graph_path: str | Path, nodes_path: str | Path, blocks_path: str | Path, output_dir: str | Path, config: AppConfig) -> dict[str, str]:
    import shutil

    image_path = Path(image_path)
    output_dir = ensure_dir(output_dir)
    graph_payload = read_json(graph_path)
    read_json(nodes_path)
    blocks_payload = load_blocks(blocks_path)
    issues = detect_review_issues(graph_payload, config)
    with Image.open(image_path) as image:
        width, height = image.size
    issues_json = output_dir / "review_issues.json"
    issues_csv = output_dir / "review_issues.csv"
    html_path = output_dir / "index.html"
    write_json(issues_json, issues)
    with issues_csv.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=["issue_type", "node_id", "text", "reason", "bbox"])
        writer.writeheader()
        for issue in issues:
            writer.writerow({**issue, "bbox": json.dumps(issue["bbox"], ensure_ascii=False)})
    data = {
        "image_src": image_path.resolve().as_uri(),
        "image_width": width,
        "image_height": height,
        "blocks": blocks_payload,
        "nodes": graph_payload.get("nodes", []),
        "edges": graph_payload.get("edges", []),
        "issues": issues,
        "summary": review_summary(graph_payload, issues),
        "thresholds": {"low_confidence": config.review_low_confidence_threshold},
    }

    # Check if React build exists, otherwise use inline template
    react_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
    react_html = react_dist / "index.html"
    if react_html.exists():
        # Copy assets folder
        react_assets = react_dist / "assets"
        output_assets = output_dir / "assets"
        if react_assets.exists():
            if output_assets.exists():
                shutil.rmtree(output_assets)
            shutil.copytree(react_assets, output_assets)

        # Copy favicon and icons
        for static_file in ["favicon.svg", "icons.svg"]:
            src = react_dist / static_file
            if src.exists():
                shutil.copy2(src, output_dir / static_file)

        # Read React build and inject data
        html_content = react_html.read_text(encoding="utf-8")
        # Convert absolute paths to relative paths for filesystem access
        html_content = html_content.replace('href="/', 'href="./')
        html_content = html_content.replace('src="/', 'src="./')
        # Update title
        image_name = image_path.name
        html_content = html_content.replace("<title>frontend</title>", f"<title>OCR Review - {image_name}</title>")
        # Inject data as a script tag at the beginning of body (before React runs)
        # Escape </script> to prevent breaking the script tag
        payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
        data_script = f'<script id="review-data" type="application/json">{payload}</script>'
        html_content = html_content.replace('<div id="root">', f'{data_script}<div id="root">')
        write_text(html_path, html_content)
    else:
        # Fallback to inline template
        write_text(html_path, _html_template(data))

    return {"html": str(html_path), "issues_json": str(issues_json), "issues_csv": str(issues_csv)}
