from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
IMAGE_DIR = ROOT / ".tmp" / "volcengine-data-service-report" / "page-screenshots"
INVENTORY = IMAGE_DIR / "inventory.json"
CONTACT_DIR = IMAGE_DIR / "contact-sheets"
CONTACT_DIR.mkdir(parents=True, exist_ok=True)


def font(size: int, bold: bool = False):
    name = "msyhbd.ttc" if bold else "msyh.ttc"
    return ImageFont.truetype(str(Path(r"C:\Windows\Fonts") / name), size)


data = json.loads(INVENTORY.read_text(encoding="utf-8"))
hash_counts = Counter(
    image.get("sha256")
    for page in data["pages"]
    for image in page["images"]
    if image.get("sha256")
)

lines = []
for page in data["pages"]:
    items = []
    for image in page["images"]:
        local_name = image.get("localName")
        if not local_name:
            continue
        with Image.open(IMAGE_DIR / local_name) as source:
            image["widthPx"], image["heightPx"] = source.size
            image["format"] = source.format
        image["hashPageCount"] = hash_counts[image["sha256"]]
        items.append(
            f"{image['index'] + 1}:{image['widthPx']}x{image['heightPx']}:"
            f"{image['bytes']}B:h{image['hashPageCount']}"
        )
    lines.append(f"{page['sid']} {page['name']}: " + ", ".join(items))

    if not page["images"]:
        continue
    cards = []
    for image in page["images"]:
        local_name = image.get("localName")
        if not local_name:
            continue
        with Image.open(IMAGE_DIR / local_name) as source:
            source = source.convert("RGB")
            thumb = source.copy()
            thumb.thumbnail((720, 430), Image.Resampling.LANCZOS)
            card = Image.new("RGB", (760, 510), "white")
            x = (760 - thumb.width) // 2
            y = 55 + (430 - thumb.height) // 2
            card.paste(thumb, (x, y))
            draw = ImageDraw.Draw(card)
            draw.rectangle((0, 0, 759, 509), outline="#9AA5B1", width=2)
            title = (
                f"候选 {image['index'] + 1} | {source.width}×{source.height}px | "
                f"{image['bytes'] / 1024:.1f} KiB"
            )
            draw.text((18, 13), title, font=font(22, True), fill="#0B2545")
            draw.text(
                (18, 478),
                f"原始文件：{local_name}",
                font=font(16),
                fill="#5B6573",
            )
            cards.append(card)
    cols = 2
    rows = (len(cards) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 760, 78 + rows * 510), "#E8EEF5")
    draw = ImageDraw.Draw(sheet)
    draw.text(
        (24, 18),
        f"{page['sid']}  {page['name']} — 官方文档原图候选",
        font=font(30, True),
        fill="#0B2545",
    )
    for index, card in enumerate(cards):
        sheet.paste(card, ((index % cols) * 760, 78 + (index // cols) * 510))
    sheet.save(CONTACT_DIR / f"{page['sid']}-{page['name']}.jpg", quality=88)

INVENTORY.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print("\n".join(lines))
