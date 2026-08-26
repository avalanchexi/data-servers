from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw


def natural_page_key(path: Path) -> int:
    return int(path.stem.rsplit("-", 1)[-1])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pages_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--per-sheet", type=int, default=4)
    args = parser.parse_args()

    pages = sorted(args.pages_dir.glob("page-*.png"), key=natural_page_key)
    if not pages:
        raise SystemExit(f"No rendered pages found in {args.pages_dir}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    thumb_width = 510
    margin = 24
    label_height = 42
    columns = 2
    rows = math.ceil(args.per_sheet / columns)

    for sheet_index, start in enumerate(range(0, len(pages), args.per_sheet), start=1):
        batch = pages[start : start + args.per_sheet]
        with Image.open(batch[0]) as sample:
            thumb_height = round(sample.height * thumb_width / sample.width)
        canvas = Image.new(
            "RGB",
            (
                columns * thumb_width + (columns + 1) * margin,
                rows * (thumb_height + label_height) + (rows + 1) * margin,
            ),
            "#d9dde3",
        )
        draw = ImageDraw.Draw(canvas)
        for offset, page_path in enumerate(batch):
            row, column = divmod(offset, columns)
            x = margin + column * (thumb_width + margin)
            y = margin + row * (thumb_height + label_height + margin)
            with Image.open(page_path) as page:
                page = page.convert("RGB")
                page.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
                canvas.paste(page, (x, y + label_height))
            draw.text((x, y + 10), page_path.stem, fill="#111827")
        output = args.output_dir / f"contact-{sheet_index:02d}.png"
        canvas.save(output, optimize=True)
        print(output)


if __name__ == "__main__":
    main()
