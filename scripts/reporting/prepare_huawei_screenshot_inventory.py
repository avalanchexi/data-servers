from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from lxml import html
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / ".tmp" / "huawei-data-service-report"
IMAGE_DIR = TMP / "page-images"
HTML_DIR = TMP / "html"
INVENTORY = TMP / "inventory.json"
CONTACT_DIR = TMP / "contact-sheets"
CONTACT_DIR.mkdir(parents=True, exist_ok=True)


def font(size: int, bold: bool = False):
    font_name = "msyhbd.ttc" if bold else "msyh.ttc"
    return ImageFont.truetype(str(Path(r"C:\Windows\Fonts") / font_name), size)


def clean_text(node) -> str:
    return " ".join(" ".join(node.itertext()).split())


data = json.loads(INVENTORY.read_text(encoding="utf-8"))
hash_counts = Counter(
    image.get("sha256")
    for page in data["pages"]
    for image in page["images"]
    if image.get("sha256")
)

summary_lines: list[str] = []
for page in data["pages"]:
    raw_path = HTML_DIR / f"{page['id']}.html"
    captions_by_url: dict[str, str] = {}
    if raw_path.exists():
        tree = html.fromstring(raw_path.read_text(encoding="utf-8"), base_url=page["url"])
        for image_node in tree.xpath(
            "//div[contains(@class, 'help-center-document')]"
            "//img[contains(@class, 'imgResize') or contains(@title, '点击放大')]"
        ):
            source = image_node.get("src") or image_node.get("data-src")
            if not source:
                continue
            figures = image_node.xpath("ancestor::div[contains(@class, 'fignone')][1]")
            caption = ""
            if figures:
                cap_nodes = figures[0].xpath(".//*[contains(@class, 'figcap')]")
                if cap_nodes:
                    caption = clean_text(cap_nodes[0])
            captions_by_url[source] = caption

    cards = []
    item_lines = []
    for image_index, image in enumerate(page["images"], start=1):
        local_path = IMAGE_DIR / image["file"]
        with Image.open(local_path) as source:
            source = source.convert("RGB")
            width, height = source.size
            image["width_px"] = width
            image["height_px"] = height
            image["format"] = source.format
            image["bytes"] = local_path.stat().st_size
            image["hash_page_count"] = hash_counts[image["sha256"]]
            image["caption"] = captions_by_url.get(image["url"], image.get("caption", ""))

            thumb = source.copy()
            thumb.thumbnail((700, 395), Image.Resampling.LANCZOS)
            card = Image.new("RGB", (740, 500), "white")
            x = (740 - thumb.width) // 2
            y = 62 + (395 - thumb.height) // 2
            card.paste(thumb, (x, y))
            draw = ImageDraw.Draw(card)
            draw.rectangle((0, 0, 739, 499), outline="#9AA5B1", width=2)
            label = f"候选 {image_index} | {width}×{height}px | {local_path.stat().st_size / 1024:.1f} KiB"
            draw.text((16, 12), label, font=font(20, True), fill="#0B2545")
            caption = image["caption"] or "官方页面原图（无图题）"
            if len(caption) > 40:
                caption = caption[:39] + "…"
            draw.text((16, 460), caption, font=font(17), fill="#374151")
            cards.append(card)
            item_lines.append(f"{image_index}:{width}x{height}:{image['caption']}")

    summary_lines.append(f"{page['id']} {page['title']}: " + " | ".join(item_lines))
    if not cards:
        continue
    cols = 2
    rows = (len(cards) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 740, 82 + rows * 500), "#E8EEF5")
    draw = ImageDraw.Draw(sheet)
    draw.text(
        (22, 18),
        f"{page['title']} | {page['id']} | 官方原图候选",
        font=font(28, True),
        fill="#0B2545",
    )
    for index, card in enumerate(cards):
        sheet.paste(card, ((index % cols) * 740, 82 + (index // cols) * 500))
    safe_title = "".join(ch if ch not in '<>:"/\\|?*' else "_" for ch in page["title"])
    sheet.save(CONTACT_DIR / f"{page['id']}-{safe_title}.jpg", quality=90)

INVENTORY.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
(TMP / "image-summary.txt").write_text("\n".join(summary_lines), encoding="utf-8")
print(f"contact_sheets={len(list(CONTACT_DIR.glob('*.jpg')))} images={data['unique_image_count']}")
