from __future__ import annotations

from pathlib import Path

from PIL import Image

from .config import AppConfig
from .io_utils import ensure_dir, write_json
from .models import TileSpec


def _iter_starts(length: int, tile_size: int, overlap: float) -> list[int]:
    if length <= tile_size:
        return [0]
    stride = max(int(tile_size * (1 - overlap)), 1)
    starts = list(range(0, max(length - tile_size, 0) + 1, stride))
    if starts[-1] != length - tile_size:
        starts.append(length - tile_size)
    return sorted(set(starts))


def generate_tiles(image_path: str | Path, config: AppConfig) -> list[TileSpec]:
    source = Path(image_path)
    tiles_dir = ensure_dir(config.artifacts_path / "tiles")

    with Image.open(source) as image:
        image = image.convert("RGB")
        width, height = image.size
        x_starts = _iter_starts(width, config.tile_size, config.tile_overlap)
        y_starts = _iter_starts(height, config.tile_size, config.tile_overlap)

        tiles: list[TileSpec] = []
        for row, y0 in enumerate(y_starts):
            for col, x0 in enumerate(x_starts):
                x1 = min(x0 + config.tile_size, width)
                y1 = min(y0 + config.tile_size, height)
                tile = image.crop((x0, y0, x1, y1))
                tile_id = f"tile_r{row:03d}_c{col:03d}"
                tile_path = tiles_dir / f"{tile_id}.png"
                tile.save(tile_path)
                tiles.append(
                    TileSpec(
                        id=tile_id,
                        path=tile_path,
                        x0=x0,
                        y0=y0,
                        x1=x1,
                        y1=y1,
                        scale=1.0,
                    )
                )

    write_json(config.artifacts_path / "tiles_manifest.json", [tile.to_dict() for tile in tiles])
    return tiles
