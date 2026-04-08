# OCR Pipeline

离线批处理 OCR 管线，面向超大思维导图图片，使用 `uv` 管理项目并以 PaddleOCR 为主识别引擎。

## 环境

推荐：

- Windows
- Python 3.10
- `uv`

### 1. 创建并同步环境

```powershell
uv sync
```

### 2. 安装 Paddle 依赖

CPU 档：

```powershell
uv add --optional ocr paddleocr
uv run python -m pip install paddlepaddle
```

GPU 档：

```powershell
uv add --optional ocr paddleocr
uv run python -m pip install paddlepaddle-gpu
```

说明：

- `paddlepaddle` / `paddlepaddle-gpu` 不放进默认依赖，避免不同机器环境冲突。
- PaddleOCR 模型默认会按配置缓存到本地目录。

## 配置

默认配置在 [config.yaml](/d:/zhk02/Desktop/OCR/config.yaml)。

## 命令

全流程：

```powershell
uv run ocr-pipeline run --input GameEngine.jpg
```

只跑 OCR：

```powershell
uv run ocr-pipeline ocr --input GameEngine.jpg
```

基于 OCR 结果构建结构：

```powershell
uv run ocr-pipeline graph --input artifacts/ocr_merged.json
```

导出复核图：

```powershell
uv run ocr-pipeline review --input artifacts/graph.json --image GameEngine.jpg
```

生成交互式 HTML 复核器：

```powershell
uv run ocr-pipeline review-html --image GameEngine.jpg --graph artifacts/graph.json
```

生成基线 seed 数据集：

```powershell
uv run ocr-pipeline baseline-seed --image GameEngine.jpg
```

打开区域基线编辑器：

```powershell
uv run ocr-pipeline edit-baseline --input baseline/GameEngine/region_01.json
```

运行回归测试：

```powershell
uv run ocr-pipeline regression --dataset baseline/GameEngine --image GameEngine.jpg
```

测试：

```powershell
uv run pytest
```

## 输出

- `artifacts/tiles/`
- `artifacts/ocr_raw.jsonl`
- `artifacts/ocr_merged.json`
- `artifacts/nodes.json`
- `artifacts/graph.json`
- `artifacts/mindmap_outline.md`
- `artifacts/review_overlay.jpg`
- `artifacts/review/index.html`
- `artifacts/review/review_issues.json`
- `artifacts/reports/summary.json`
- `artifacts/reports/summary.md`
- `artifacts/editors/region_01_editor.html`

## 当前实现说明

- OCR 主引擎封装为 PaddleOCR 适配层。
- 默认识别语言固定为中文，并开启方向分类。
- 结构恢复采用启发式空间推断，适合作为首版离线结果和人工复核底稿。
- 如当前 shell 的 `uv run` 受本机路径或缓存权限影响，也可以直接使用 `.venv\\Scripts\\ocr-pipeline.exe` 与 `.venv\\Scripts\\python.exe`。
