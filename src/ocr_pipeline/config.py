from __future__ import annotations

from pathlib import Path

import yaml
from pydantic import BaseModel, Field


class OCRSettings(BaseModel):
    lang: str = "ch"
    use_angle_cls: bool = True
    use_gpu: bool = False
    det_model_dir: str | None = None
    rec_model_dir: str | None = None
    cls_model_dir: str | None = None
    model_root: str = ".paddle-models"


class AppConfig(BaseModel):
    artifacts_dir: str = "artifacts"
    tile_size: int = 1800
    tile_overlap: float = Field(default=0.15, ge=0.0, lt=0.5)
    min_text_confidence: float = Field(default=0.45, ge=0.0, le=1.0)
    node_merge_distance: float = 80.0
    node_merge_vertical_gap: float = 36.0
    graph_max_parent_distance: float = 1600.0
    graph_horizontal_bias: float = Field(default=0.65, ge=0.0, le=1.0)
    graph_vertical_tolerance: float = 220.0
    export_overlay_line_width: int = 3
    review_low_confidence_threshold: float = Field(default=0.9, ge=0.0, le=1.0)
    review_weak_edge_threshold: float = Field(default=0.55, ge=0.0, le=1.0)
    review_oversized_lines_threshold: int = 8
    review_oversized_height_threshold: float = 240.0
    review_dense_region_radius: float = 280.0
    review_dense_region_neighbor_threshold: int = 8
    ocr: OCRSettings = OCRSettings()

    @property
    def artifacts_path(self) -> Path:
        return Path(self.artifacts_dir)


def load_config(path: str | Path) -> AppConfig:
    with Path(path).open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return AppConfig.model_validate(data)
