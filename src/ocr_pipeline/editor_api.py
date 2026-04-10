from __future__ import annotations

import base64
import io
import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from PIL import Image

from .config import AppConfig
from .ocr import PaddleOCREngine


def _decode_data_url(data_url: str) -> bytes:
    if "," not in data_url:
        raise ValueError("Invalid image_data payload.")
    _, encoded = data_url.split(",", 1)
    return base64.b64decode(encoded)


def _resolve_image_path(image_path: str) -> Path:
    """Resolve image path to absolute path.

    Handles various path formats:
    - Absolute paths: D:/path/to/image.jpg
    - file:/// URLs: file:///D:/path/to/image.jpg
    - Relative paths: /image.jpg or image.jpg (resolved relative to project root)
    """
    source = Path(str(image_path))
    print(f"[DEBUG] _resolve_image_path input: {image_path}")

    # Handle file:/// URLs
    if source.as_posix().startswith('file:///'):
        result = Path(image_path[8:])
        print(f"[DEBUG] file:/// URL resolved to: {result}")
        return result

    # If already absolute, use as-is
    if source.is_absolute():
        print(f"[DEBUG] Absolute path: {source}")
        return source

    # For relative paths, resolve from project root (2 levels up from this file)
    # This file is at src/ocr_pipeline/editor_api.py, project root is ../../..
    project_root = Path(__file__).parent.parent.parent
    result = (project_root / image_path.lstrip('/')).resolve()
    print(f"[DEBUG] Relative path resolved: project_root={project_root}, result={result}")
    return result


def _load_region_image(payload: dict[str, Any]) -> tuple[Image.Image, float, float]:
    padding = int(payload.get("padding", 0) or 0)
    if payload.get("image_data"):
        image_bytes = _decode_data_url(str(payload["image_data"]))
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        offset_x, offset_y = payload.get("offset", [0, 0])
        return image, float(offset_x), float(offset_y)

    image_path = payload.get("image_path")
    crop_bbox = payload.get("crop_bbox")
    if not image_path or not crop_bbox:
        raise ValueError("image_path and crop_bbox are required when image_data is not provided.")

    source = _resolve_image_path(image_path)
    if not source.exists():
        raise FileNotFoundError(f"Image not found: {source}")

    left, top, right, bottom = [int(round(value)) for value in crop_bbox]
    left, right = sorted((left, right))
    top, bottom = sorted((top, bottom))
    with Image.open(source) as image:
        rgb = image.convert("RGB")
        left = max(0, left - padding)
        top = max(0, top - padding)
        right = min(rgb.width, right + padding)
        bottom = min(rgb.height, bottom + padding)
        if right <= left:
            right = min(rgb.width, left + 1)
        if bottom <= top:
            bottom = min(rgb.height, top + 1)
        crop = rgb.crop((left, top, right, bottom))
    return crop, float(left), float(top)


def _bbox_union(blocks: list[dict[str, Any]]) -> list[float]:
    left = min(block["bbox"][0] for block in blocks)
    top = min(block["bbox"][1] for block in blocks)
    right = max(block["bbox"][2] for block in blocks)
    bottom = max(block["bbox"][3] for block in blocks)
    return [left, top, right, bottom]


def run_editor_region_ocr(
    payload: dict[str, Any],
    *,
    config: AppConfig,
    engine: PaddleOCREngine | None = None,
) -> dict[str, Any]:
    engine = engine or PaddleOCREngine(config)
    image, offset_x, offset_y = _load_region_image(payload)
    blocks = engine.run_image(
        image,
        tile_id="editor_region",
        offset_x=offset_x,
        offset_y=offset_y,
    )
    rows = [
        {
            "id": block.id,
            "text": block.text,
            "bbox": [block.left, block.top, block.right, block.bottom],
            "confidence": block.confidence,
        }
        for block in sorted(blocks, key=lambda item: (item.top, item.left))
    ]
    suggested_text = "\n".join(row["text"] for row in rows)
    suggested_bbox = _bbox_union(rows) if rows else None
    return {
        "blocks": rows,
        "suggested_text": suggested_text,
        "suggested_bbox": suggested_bbox,
    }


def serve_editor_ocr(config: AppConfig, host: str = "127.0.0.1", port: int = 8765) -> None:
    engine = PaddleOCREngine(config)

    class Handler(BaseHTTPRequestHandler):
        def _send(self, status: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self) -> None:  # noqa: N802
            self.send_response(HTTPStatus.NO_CONTENT)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
            self.end_headers()

        def do_GET(self) -> None:  # noqa: N802
            if self.path != "/health":
                self._send(HTTPStatus.NOT_FOUND, {"error": "Not found"})
                return
            self._send(HTTPStatus.OK, {"status": "ok"})

        def do_POST(self) -> None:  # noqa: N802
            if self.path != "/ocr/region":
                self._send(HTTPStatus.NOT_FOUND, {"error": "Not found"})
                return
            try:
                content_length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(self.rfile.read(content_length) or b"{}")
                # Debug: log the received payload
                print(f"[DEBUG] Received payload: image_path={payload.get('image_path')}, crop_bbox={payload.get('crop_bbox')}")
                result = run_editor_region_ocr(payload, config=config, engine=engine)
                self._send(HTTPStatus.OK, result)
            except Exception as exc:  # pragma: no cover - defensive server branch
                print(f"[ERROR] {exc}")
                self._send(HTTPStatus.BAD_REQUEST, {"error": str(exc)})

        def log_message(self, format: str, *args: object) -> None:  # noqa: A003
            return

    server = ThreadingHTTPServer((host, port), Handler)
    try:
        server.serve_forever()
    finally:
        server.server_close()
