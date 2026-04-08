from __future__ import annotations

from pathlib import Path

import typer

from .config import load_config
from .editor import build_baseline_editor
from .editor_api import serve_editor_ocr
from .export import export_blocks, export_graph, export_nodes, export_outline, export_review_overlay
from .graph import build_graph
from .io_utils import read_json
from .merge import merge_blocks
from .models import OCRBlock
from .nodes import build_nodes
from .ocr import run_ocr
from .pipeline import run_full_pipeline
from .preprocess import preprocess_image
from .regression import build_seed_dataset, run_regression
from .review import build_review_bundle
from .tiling import generate_tiles

app = typer.Typer(add_completion=False, no_args_is_help=True)
INPUT_OPTION = typer.Option(..., "--input", exists=True, readable=True)
CONFIG_OPTION = typer.Option("--config", exists=True, readable=True)
IMAGE_OPTION = typer.Option(..., "--image", exists=True, readable=True)
DATASET_OPTION = typer.Option(
    ...,
    "--dataset",
    exists=True,
    file_okay=False,
    dir_okay=True,
    resolve_path=True,
)


def _load_blocks(path: Path) -> list[OCRBlock]:
    payload = read_json(path)
    return [OCRBlock(**row) for row in payload]  # type: ignore[arg-type]


@app.command()
def run(
    input: Path = INPUT_OPTION,
    config: Path = "config.yaml",
) -> None:
    app_config = load_config(config)
    outputs = run_full_pipeline(input, app_config)
    for key, value in outputs.items():
        typer.echo(f"{key}: {value}")


@app.command()
def ocr(
    input: Path = INPUT_OPTION,
    config: Path = "config.yaml",
) -> None:
    app_config = load_config(config)
    preprocess_image(input, app_config)
    tiles = generate_tiles(input, app_config)
    blocks = run_ocr(tiles, app_config)
    export_blocks(blocks, app_config, "ocr_raw.jsonl")
    merged = merge_blocks(blocks)
    output = export_blocks(merged, app_config, "ocr_merged.json")
    typer.echo(str(output))


@app.command()
def graph(
    input: Path = INPUT_OPTION,
    config: Path = "config.yaml",
) -> None:
    app_config = load_config(config)
    blocks = _load_blocks(input)
    nodes = build_nodes(
        blocks,
        merge_distance=app_config.node_merge_distance,
        vertical_gap=app_config.node_merge_vertical_gap,
    )
    export_nodes(nodes, app_config)
    payload = build_graph(
        nodes,
        max_parent_distance=app_config.graph_max_parent_distance,
        horizontal_bias=app_config.graph_horizontal_bias,
        vertical_tolerance=app_config.graph_vertical_tolerance,
    )
    graph_path = export_graph(payload, app_config)
    outline_path = export_outline(payload, app_config)
    typer.echo(f"graph: {graph_path}")
    typer.echo(f"outline: {outline_path}")


@app.command()
def review(
    input: Path = INPUT_OPTION,
    image: Path = IMAGE_OPTION,
    config: Path = "config.yaml",
) -> None:
    app_config = load_config(config)
    payload = read_json(input)
    output = export_review_overlay(payload, image, app_config)
    typer.echo(str(output))


@app.command("review-html")
def review_html(
    image: Path = IMAGE_OPTION,
    graph: Path = typer.Option(..., "--graph", exists=True, readable=True),
    nodes: Path | None = typer.Option(None, "--nodes"),
    blocks: Path | None = typer.Option(None, "--blocks"),
    output: Path = typer.Option("artifacts/review", "--output"),
    config: Path = "config.yaml",
) -> None:
    app_config = load_config(config)
    nodes = nodes or graph.with_name("nodes.json")
    blocks = blocks or graph.with_name("ocr_merged.json")
    outputs = build_review_bundle(
        image_path=image,
        graph_path=graph,
        nodes_path=nodes,
        blocks_path=blocks,
        output_dir=output,
        config=app_config,
    )
    for key, value in outputs.items():
        typer.echo(f"{key}: {value}")


@app.command()
def regression(
    dataset: Path = DATASET_OPTION,
    image: Path = IMAGE_OPTION,
    graph: Path = typer.Option("artifacts/graph.json", "--graph", exists=True, readable=True),
    nodes: Path = typer.Option("artifacts/nodes.json", "--nodes", exists=True, readable=True),
    blocks: Path = typer.Option("artifacts/ocr_merged.json", "--blocks", exists=True, readable=True),
    output: Path = typer.Option("artifacts/reports", "--output"),
    config: Path = "config.yaml",
) -> None:
    app_config = load_config(config)
    summary = run_regression(
        dataset_dir=dataset,
        image_path=image,
        blocks_path=blocks,
        nodes_path=nodes,
        graph_path=graph,
        output_dir=output,
        config=app_config,
    )
    typer.echo(f"regions: {summary['region_count']}")
    typer.echo(f"fail_cases: {summary['fail_case_count']}")
    typer.echo(f"summary: {output / 'summary.json'}")


@app.command("baseline-seed")
def baseline_seed(
    image: Path = IMAGE_OPTION,
    graph: Path = typer.Option("artifacts/graph.json", "--graph", exists=True, readable=True),
    blocks: Path = typer.Option("artifacts/ocr_merged.json", "--blocks", exists=True, readable=True),
    output: Path = typer.Option("baseline/GameEngine", "--output"),
    regions: int = typer.Option(8, "--regions", min=1, max=15),
) -> None:
    summary = build_seed_dataset(
        image_path=image,
        blocks_path=blocks,
        graph_path=graph,
        output_dir=output,
        region_count=regions,
    )
    typer.echo(f"dataset: {summary['dataset_dir']}")
    typer.echo(f"regions: {summary['region_count']}")


@app.command("edit-baseline")
def edit_baseline(
    input: Path = INPUT_OPTION,
    output: Path = typer.Option("artifacts/editors", "--output"),
) -> None:
    outputs = build_baseline_editor(region_path=input, output_dir=output)
    for key, value in outputs.items():
        typer.echo(f"{key}: {value}")


@app.command("serve-editor-ocr")
def serve_editor_ocr_command(
    host: str = typer.Option("127.0.0.1", "--host"),
    port: int = typer.Option(8765, "--port", min=1, max=65535),
    config: Path = "config.yaml",
) -> None:
    app_config = load_config(config)
    typer.echo(f"serving: http://{host}:{port}")
    serve_editor_ocr(config=app_config, host=host, port=port)
