from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


@dataclass(slots=True)
class OCRBlock:
    id: str
    text: str
    bbox: list[list[float]]
    confidence: float
    tile_id: str
    scale: float

    @property
    def left(self) -> float:
        return min(point[0] for point in self.bbox)

    @property
    def right(self) -> float:
        return max(point[0] for point in self.bbox)

    @property
    def top(self) -> float:
        return min(point[1] for point in self.bbox)

    @property
    def bottom(self) -> float:
        return max(point[1] for point in self.bbox)

    @property
    def width(self) -> float:
        return self.right - self.left

    @property
    def height(self) -> float:
        return self.bottom - self.top

    @property
    def center_x(self) -> float:
        return (self.left + self.right) / 2

    @property
    def center_y(self) -> float:
        return (self.top + self.bottom) / 2

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class MindmapNode:
    id: str
    text: str
    bbox: list[list[float]]
    lines: list[str]
    confidence: float
    block_ids: list[str] = field(default_factory=list)

    @property
    def left(self) -> float:
        return min(point[0] for point in self.bbox)

    @property
    def right(self) -> float:
        return max(point[0] for point in self.bbox)

    @property
    def top(self) -> float:
        return min(point[1] for point in self.bbox)

    @property
    def bottom(self) -> float:
        return max(point[1] for point in self.bbox)

    @property
    def center_x(self) -> float:
        return (self.left + self.right) / 2

    @property
    def center_y(self) -> float:
        return (self.top + self.bottom) / 2

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class MindmapEdge:
    parent_id: str
    child_id: str
    score: float
    reason: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class TileSpec:
    id: str
    path: Path
    x0: int
    y0: int
    x1: int
    y1: int
    scale: float

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["path"] = str(self.path)
        return payload
