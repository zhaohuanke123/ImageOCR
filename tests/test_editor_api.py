import base64
import io

from PIL import Image

from ocr_pipeline.config import AppConfig
from ocr_pipeline.editor_api import run_editor_region_ocr


class StubEngine:
    def run_image(self, image, *, tile_id, offset_x, offset_y, scale=1.0):  # noqa: ARG002
        assert image.size == (40, 20)
        from ocr_pipeline.models import OCRBlock

        return [
            OCRBlock(
                id="editor_region_b0001",
                text="Cloud",
                bbox=[
                    [offset_x + 2, offset_y + 3],
                    [offset_x + 22, offset_y + 3],
                    [offset_x + 22, offset_y + 15],
                    [offset_x + 2, offset_y + 15],
                ],
                confidence=0.98,
                tile_id=tile_id,
                scale=1.0,
            )
        ]


def test_run_editor_region_ocr_with_image_data() -> None:
    image = Image.new("RGB", (40, 20), "white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    data_url = "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")

    payload = run_editor_region_ocr(
        {"image_data": data_url, "offset": [10, 20]},
        config=AppConfig(),
        engine=StubEngine(),  # type: ignore[arg-type]
    )

    assert payload["suggested_text"] == "Cloud"
    assert payload["suggested_bbox"] == [12, 23, 32, 35]
    assert payload["blocks"][0]["bbox"] == [12, 23, 32, 35]
