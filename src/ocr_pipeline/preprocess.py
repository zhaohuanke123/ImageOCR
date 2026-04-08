from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance

from .config import AppConfig
from .io_utils import ensure_dir, write_json


def preprocess_image(image_path: str | Path, config: AppConfig) -> dict:
    source = Path(image_path)
    artifacts_dir = ensure_dir(config.artifacts_path)
    preprocess_dir = ensure_dir(artifacts_dir / "preprocess")

    with Image.open(source) as image:
        image = image.convert("RGB")
        width, height = image.size
        enhanced = ImageEnhance.Contrast(image).enhance(1.1)
        preview = enhanced.copy()
        preview.thumbnail((2048, 2048))
        preview_path = preprocess_dir / f"{source.stem}_preview.jpg"
        preview.save(preview_path, quality=90)

    manifest = {
        "source": str(source),
        "width": width,
        "height": height,
        "preview_path": str(preview_path),
        "scales": [1.0, 0.75, 0.5],
    }
    write_json(preprocess_dir / "manifest.json", manifest)
    return manifest
