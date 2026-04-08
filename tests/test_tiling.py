from pathlib import Path

from PIL import Image

from ocr_pipeline.config import AppConfig
from ocr_pipeline.tiling import generate_tiles


def test_generate_tiles_covers_image(tmp_path: Path) -> None:
    image_path = tmp_path / "sample.png"
    Image.new("RGB", (2500, 2500), "white").save(image_path)
    config = AppConfig(artifacts_dir=str(tmp_path / "artifacts"), tile_size=1000, tile_overlap=0.2)

    tiles = generate_tiles(image_path, config)

    assert len(tiles) == 9
    assert min(tile.x0 for tile in tiles) == 0
    assert min(tile.y0 for tile in tiles) == 0
    assert max(tile.x1 for tile in tiles) == 2500
    assert max(tile.y1 for tile in tiles) == 2500
