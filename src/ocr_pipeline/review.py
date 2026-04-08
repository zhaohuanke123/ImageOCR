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
body{{margin:0;font-family:"Segoe UI","PingFang SC",sans-serif;background:#f4efe5;color:#201b16}}.layout{{display:grid;grid-template-columns:360px 1fr;height:100vh}}.sidebar{{overflow:auto;padding:16px;border-right:1px solid #d8d1c1;background:#fffdf8}}.viewer{{position:relative;overflow:hidden;background:#d6dfdb}}.summary{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}.card,.item{{background:#fffdf8;border:1px solid #d8d1c1;border-radius:12px;padding:10px}}.item{{cursor:pointer;margin-bottom:8px}}.item.active{{border-color:#0f766e}}input,select{{width:100%;padding:8px 10px;border:1px solid #d8d1c1;border-radius:10px}}label{{display:flex;gap:8px;align-items:center;margin:6px 0}}.shell{{position:absolute;inset:0;overflow:auto;cursor:grab}}.shell.dragging{{cursor:grabbing}}.stage{{position:relative;transform-origin:top left}}.stage img{{display:block;max-width:none}}.overlay{{position:absolute;inset:0}}.toolbar{{position:absolute;top:12px;left:12px;z-index:10;background:#fffdf8;border:1px solid #d8d1c1;border-radius:12px;padding:10px}}pre{{white-space:pre-wrap;font-size:12px}}</style></head>
<body><div class="layout"><aside class="sidebar"><h1>OCR 复核器</h1><div class="summary" id="summary"></div><h2>筛选</h2><input id="search" type="search" placeholder="搜索文本"><label><input id="show-blocks" type="checkbox">显示 OCR blocks</label><label><input id="show-nodes" type="checkbox" checked>显示 nodes</label><label><input id="show-edges" type="checkbox">显示 edges</label><label><input id="roots-only" type="checkbox">只看 roots</label><label><input id="low-only" type="checkbox">只看低置信节点</label><select id="issue-filter"><option value="">全部问题类型</option></select><h2>问题清单</h2><div id="issue-list"></div><h2>节点详情</h2><div class="card"><pre id="detail">点击节点或问题项查看详情</pre></div></aside><main class="viewer"><div class="toolbar"><label>缩放 <input id="zoom" type="range" min="20" max="200" value="60"><span id="zoom-value">60%</span></label></div><div class="shell" id="shell"><div class="stage" id="stage"><img id="image"><svg class="overlay" id="overlay"></svg></div></div></main></div>
<script id="review-data" type="application/json">{payload}</script><script>
const data=JSON.parse(document.getElementById("review-data").textContent);const nodeById=Object.fromEntries(data.nodes.map(n=>[n.id,n]));const state={{scale:.6,selectedId:null,search:"",issueType:"",showBlocks:false,showNodes:true,showEdges:false,rootsOnly:false,lowOnly:false}};const image=document.getElementById("image"),stage=document.getElementById("stage"),overlay=document.getElementById("overlay"),shell=document.getElementById("shell"),detail=document.getElementById("detail"),issueList=document.getElementById("issue-list"),issueFilter=document.getElementById("issue-filter");image.src=data.image_src;image.width=data.image_width;image.height=data.image_height;overlay.setAttribute("viewBox",`0 0 ${{data.image_width}} ${{data.image_height}}`);overlay.setAttribute("width",data.image_width);overlay.setAttribute("height",data.image_height);stage.style.width=`${{data.image_width}}px`;stage.style.height=`${{data.image_height}}px`;
function applyScale(){{stage.style.transform=`scale(${{state.scale}})`;document.getElementById("zoom-value").textContent=`${{Math.round(state.scale*100)}}%`;}}function matches(text){{return !state.search||text.toLowerCase().includes(state.search.toLowerCase());}}function visibleNode(node){{if(state.rootsOnly&&node.parent_id)return false;if(state.lowOnly&&node.confidence>=data.thresholds.low_confidence)return false;return matches(node.text);}}function bboxPath(bbox){{return bbox.map((p,i)=>`${{i===0?"M":"L"}}${{p[0]}},${{p[1]}}`).join(" ")+" Z";}}function renderSummary(){{const items=[["Nodes",data.summary.node_count],["Edges",data.summary.edge_count],["Roots",data.summary.root_count],["Issues",data.summary.issue_count]];document.getElementById("summary").innerHTML=items.map(([k,v])=>`<div class="card"><div>${{k}}</div><strong>${{v}}</strong></div>`).join("");}}function center(node){{const cx=(node.bbox[0][0]+node.bbox[2][0])/2*state.scale,cy=(node.bbox[0][1]+node.bbox[2][1])/2*state.scale;shell.scrollLeft=Math.max(0,cx-shell.clientWidth/2);shell.scrollTop=Math.max(0,cy-shell.clientHeight/2);}}function selectNode(nodeId){{state.selectedId=nodeId;const node=nodeById[nodeId];if(!node)return;detail.textContent=JSON.stringify(node,null,2);center(node);renderIssues();renderOverlay();}}function renderIssues(){{const filtered=data.issues.filter(issue=>(!state.issueType||issue.issue_type===state.issueType)&&matches(issue.text));issueList.innerHTML=filtered.map(issue=>`<div class="item ${{state.selectedId===issue.node_id?"active":""}}" data-node="${{issue.node_id}}"><strong>${{issue.issue_type}}</strong><div>${{issue.node_id}}</div><div>${{issue.reason}}</div></div>`).join("");for(const el of issueList.querySelectorAll("[data-node]"))el.addEventListener("click",()=>selectNode(el.dataset.node));}}function renderOverlay(){{const parts=[];if(state.showEdges)for(const edge of data.edges){{const p=nodeById[edge.parent_id],c=nodeById[edge.child_id];if(!p||!c||!visibleNode(p)||!visibleNode(c))continue;const px=(p.bbox[0][0]+p.bbox[2][0])/2,py=(p.bbox[0][1]+p.bbox[2][1])/2,cx=(c.bbox[0][0]+c.bbox[2][0])/2,cy=(c.bbox[0][1]+c.bbox[2][1])/2;parts.push(`<line x1="${{px}}" y1="${{py}}" x2="${{cx}}" y2="${{cy}}" stroke="rgba(22,163,74,.55)" stroke-width="2"/>`);}}if(state.showBlocks)for(const block of data.blocks){{if(!matches(block.text))continue;parts.push(`<path d="${{bboxPath(block.bbox)}}" fill="rgba(37,99,235,.08)" stroke="rgba(37,99,235,.55)" stroke-width="1"/>`);}}if(state.showNodes)for(const node of data.nodes){{if(!visibleNode(node))continue;const selected=state.selectedId===node.id;parts.push(`<path data-node="${{node.id}}" d="${{bboxPath(node.bbox)}}" fill="${{selected?"rgba(245,158,11,.25)":"rgba(220,38,38,.08)"}}" stroke="${{selected?"rgba(245,158,11,.95)":"rgba(220,38,38,.85)"}}" stroke-width="${{selected?4:2}}"/>`);}}overlay.innerHTML=parts.join("");for(const el of overlay.querySelectorAll("[data-node]"))el.addEventListener("click",()=>selectNode(el.dataset.node));}}
const types=[...new Set(data.issues.map(i=>i.issue_type))].sort();issueFilter.innerHTML=`<option value="">全部问题类型</option>`+types.map(t=>`<option value="${{t}}">${{t}}</option>`).join("");document.getElementById("search").addEventListener("input",e=>{{state.search=e.target.value;renderIssues();renderOverlay();}});document.getElementById("show-blocks").addEventListener("change",e=>{{state.showBlocks=e.target.checked;renderOverlay();}});document.getElementById("show-nodes").addEventListener("change",e=>{{state.showNodes=e.target.checked;renderOverlay();}});document.getElementById("show-edges").addEventListener("change",e=>{{state.showEdges=e.target.checked;renderOverlay();}});document.getElementById("roots-only").addEventListener("change",e=>{{state.rootsOnly=e.target.checked;renderOverlay();}});document.getElementById("low-only").addEventListener("change",e=>{{state.lowOnly=e.target.checked;renderOverlay();}});issueFilter.addEventListener("change",e=>{{state.issueType=e.target.value;renderIssues();}});document.getElementById("zoom").addEventListener("input",e=>{{state.scale=Number(e.target.value)/100;applyScale();}});let drag=null;shell.addEventListener("mousedown",e=>{{drag={{x:e.clientX,y:e.clientY,left:shell.scrollLeft,top:shell.scrollTop}};shell.classList.add("dragging");}});window.addEventListener("mousemove",e=>{{if(!drag)return;shell.scrollLeft=drag.left-(e.clientX-drag.x);shell.scrollTop=drag.top-(e.clientY-drag.y);}});window.addEventListener("mouseup",()=>{{drag=null;shell.classList.remove("dragging");}});renderSummary();applyScale();renderIssues();renderOverlay();
</script></body></html>"""


def build_review_bundle(image_path: str | Path, graph_path: str | Path, nodes_path: str | Path, blocks_path: str | Path, output_dir: str | Path, config: AppConfig) -> dict[str, str]:
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
    write_text(html_path, _html_template(data))
    return {"html": str(html_path), "issues_json": str(issues_json), "issues_csv": str(issues_csv)}
