from __future__ import annotations

import argparse
from pathlib import Path

import pypdfium2 as pdfium


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--scale", type=float, default=2.0)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    document = pdfium.PdfDocument(args.pdf)
    for index in range(len(document)):
        page = document[index]
        bitmap = page.render(scale=args.scale)
        image = bitmap.to_pil().convert("RGB")
        image.save(args.output_dir / f"page-{index + 1}.png", optimize=True)
        print(f"page-{index + 1}.png {image.width}x{image.height}")
        page.close()
    document.close()


if __name__ == "__main__":
    main()
