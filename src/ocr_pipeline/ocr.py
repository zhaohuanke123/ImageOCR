from __future__ import annotations

import os
import tempfile
from pathlib import Path

from PIL import Image

from .config import AppConfig
from .models import OCRBlock, TileSpec


class PaddleOCREngine:
    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self._ocr = None

    def _build(self) -> object:
        if self._ocr is not None:
            return self._ocr
        os.environ.setdefault("FLAGS_use_mkldnn", "0")
        os.environ.setdefault("DNNL_VERBOSE", "0")
        os.environ.setdefault("OMP_NUM_THREADS", "1")
        try:
            from paddleocr import PaddleOCR
        except ImportError as exc:
            raise RuntimeError(
                "PaddleOCR is not installed. Run `uv add --optional ocr paddleocr` and install "
                "`paddlepaddle` or `paddlepaddle-gpu` for your environment."
            ) from exc

        kwargs = {
            "use_angle_cls": self.config.ocr.use_angle_cls,
            "lang": self.config.ocr.lang,
            "use_gpu": self.config.ocr.use_gpu,
            "enable_mkldnn": False,
        }
        for key in ("det_model_dir", "rec_model_dir", "cls_model_dir"):
            value = getattr(self.config.ocr, key)
            if value:
                kwargs[key] = value

        model_root = Path(self.config.ocr.model_root)
        model_root.mkdir(parents=True, exist_ok=True)
        kwargs["ocr_version"] = "PP-OCRv4"
        kwargs["show_log"] = False

        self._ocr = PaddleOCR(**kwargs)
        return self._ocr

    def _parse_result(
        self, raw_result: object, *, tile_id: str, scale: float, offset_x: float, offset_y: float
    ) -> list[OCRBlock]:
        lines = raw_result[0] if raw_result else []
        blocks: list[OCRBlock] = []
        for index, entry in enumerate(lines):
            if len(entry) < 2:
                continue
            bbox, rec = entry
            text = str(rec[0]).strip()
            confidence = float(rec[1])
            if not text or confidence < self.config.min_text_confidence:
                continue
            mapped_bbox = [[float(x + offset_x), float(y + offset_y)] for x, y in bbox]
            blocks.append(
                OCRBlock(
                    id=f"{tile_id}_b{index:04d}",
                    text=text,
                    bbox=mapped_bbox,
                    confidence=confidence,
                    tile_id=tile_id,
                    scale=scale,
                )
            )
        return blocks

    def run_image_path(
        self,
        image_path: str | Path,
        *,
        tile_id: str = "image",
        scale: float = 1.0,
        offset_x: float = 0.0,
        offset_y: float = 0.0,
    ) -> list[OCRBlock]:
        ocr = self._build()
        raw_result = ocr.ocr(str(image_path), cls=self.config.ocr.use_angle_cls)
        return self._parse_result(
            raw_result,
            tile_id=tile_id,
            scale=scale,
            offset_x=offset_x,
            offset_y=offset_y,
        )

    def run_tile(self, tile: TileSpec) -> list[OCRBlock]:
        return self.run_image_path(
            tile.path,
            tile_id=tile.id,
            scale=tile.scale,
            offset_x=tile.x0,
            offset_y=tile.y0,
        )

    def run_image(
        self,
        image: Image.Image,
        *,
        tile_id: str = "editor",
        scale: float = 1.0,
        offset_x: float = 0.0,
        offset_y: float = 0.0,
    ) -> list[OCRBlock]:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as handle:
            temp_path = Path(handle.name)
        try:
            image.save(temp_path)
            return self.run_image_path(
                temp_path,
                tile_id=tile_id,
                scale=scale,
                offset_x=offset_x,
                offset_y=offset_y,
            )
        finally:
            temp_path.unlink(missing_ok=True)


def run_ocr(tiles: list[TileSpec], config: AppConfig) -> list[OCRBlock]:
    engine = PaddleOCREngine(config)
    blocks: list[OCRBlock] = []
    for tile in tiles:
        blocks.extend(engine.run_tile(tile))
    return blocks
