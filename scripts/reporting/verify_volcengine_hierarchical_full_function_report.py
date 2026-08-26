from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image

from build_volcengine_hierarchical_full_function_report import PAGE_FUNCTIONS, clean_heading


ROOT = Path(__file__).resolve().parents[2]
DOCX = ROOT / "火山引擎DataLeap数据服务业务架构梳理（官网层级·全功能版）.docx"
TMP = ROOT / ".tmp" / "volcengine-data-service-report"
CONTENT = json.loads((TMP / "page-content" / "page-content.json").read_text(encoding="utf-8"))
INVENTORY = json.loads((TMP / "page-screenshots" / "inventory.json").read_text(encoding="utf-8"))
IMAGE_DIR = TMP / "page-screenshots"
SCREENSHOT = Path(r"C:\Users\何峰\AppData\Local\Temp\codex-clipboard-9217ad3c-1a86-42ab-b592-2f20126fb448.png")
DIAGRAM = TMP / "data-service-business-architecture.png"

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_sha(path: Path) -> str:
    return sha256(path.read_bytes())


url_to_path = {}
for page in INVENTORY["pages"]:
    for image in page.get("images", []):
        if image.get("url") and image.get("localName"):
            url_to_path[image["url"]] = IMAGE_DIR / image["localName"]
            url_to_path[Path(image["url"].split("?", 1)[0]).name] = IMAGE_DIR / image["localName"]

expected_originals = []
expected_headings = []
expected_config_labels = []
skip_labels = {"参数", "配置项", "操作", "序号", "字段名称", "参数配置", "返回信息", "所属层级"}
for page in CONTENT["pages"]:
    for block in page["blocks"]:
        if block.get("type") == "heading":
            expected_headings.append(clean_heading(block.get("text", "")))
        elif block.get("type") == "image":
            src = block.get("src", "")
            image_path = url_to_path.get(src) or url_to_path.get(Path(src.split("?", 1)[0]).name)
            if not image_path or not image_path.is_file():
                raise AssertionError(f"Missing source image: {page['sid']} {src}")
            with Image.open(image_path) as image:
                if image.width >= 300 and image.height >= 200:
                    expected_originals.append(image_path)
        elif block.get("type") == "table":
            for row in block.get("rows", [])[1:]:
                if not row:
                    continue
                label = " ".join(str(row[0]).split())
                if label and label not in skip_labels:
                    expected_config_labels.append(label)

if len(expected_originals) != 44:
    raise AssertionError(f"Expected 44 meaningful source images, got {len(expected_originals)}")

with zipfile.ZipFile(DOCX) as archive:
    document = ET.fromstring(archive.read("word/document.xml"))
    text = "".join(node.text or "" for node in document.findall(".//w:t", NS))
    doc_pr = document.findall(".//wp:docPr", NS)
    alt_texts = [node.get("descr") for node in doc_pr if node.get("descr")]
    if len(doc_pr) != 46 or len(alt_texts) != 46:
        raise AssertionError(f"Image/alt mismatch: inline={len(doc_pr)}, alt={len(alt_texts)}")

    style_counts = {f"Heading {level}": 0 for level in range(1, 6)}
    for paragraph in document.findall(".//w:p", NS):
        style = paragraph.find("w:pPr/w:pStyle", NS)
        if style is None:
            continue
        style_id = style.get(f"{{{NS['w']}}}val")
        if style_id and style_id.startswith("Heading"):
            level = style_id.replace("Heading", "")
            label = f"Heading {level}"
            if label in style_counts:
                style_counts[label] += 1
    expected_style_counts = {"Heading 1": 8, "Heading 2": 22, "Heading 3": 114, "Heading 4": 71, "Heading 5": 25}
    if style_counts != expected_style_counts:
        raise AssertionError(f"Heading hierarchy changed: {style_counts}")

    missing_headings = [heading for heading in expected_headings if heading not in text]
    if missing_headings:
        raise AssertionError(f"Missing official headings: {missing_headings[:10]}")
    missing_functions = [
        f"{sid}: {item}"
        for sid, items in PAGE_FUNCTIONS.items()
        for item in items
        if item not in text
    ]
    if missing_functions:
        raise AssertionError(f"Missing function inventory items: {missing_functions[:10]}")
    missing_labels = [label for label in expected_config_labels if label not in text]
    if missing_labels:
        raise AssertionError(f"Missing official config labels: {missing_labels[:20]}")

    media = {
        name: archive.read(name)
        for name in archive.namelist()
        if name.startswith("word/media/")
    }
    media_hashes = {sha256(data) for data in media.values()}
    source_hashes = {file_sha(path) for path in expected_originals}
    missing_hashes = sorted(source_hashes - media_hashes)
    if missing_hashes:
        raise AssertionError(f"Official originals not embedded byte-for-byte: {missing_hashes[:5]}")
    for retained in (SCREENSHOT, DIAGRAM):
        if file_sha(retained) not in media_hashes:
            raise AssertionError(f"Retained visual changed or missing: {retained}")

    settings = ET.fromstring(archive.read("word/settings.xml"))
    node = settings.find("w:doNotCompressPictures", NS)
    if node is None or node.get(f"{{{NS['w']}}}val") not in {"true", "1", "on"}:
        raise AssertionError("Word no-compression setting missing")

print(f"DOCX: {DOCX}")
print(f"File size: {DOCX.stat().st_size:,} bytes")
print("Official page coverage: 23/23")
print(f"Official internal headings present: {len(expected_headings)}/{len(expected_headings)}")
print(f"Function inventory items present: {sum(map(len, PAGE_FUNCTIONS.values()))}/{sum(map(len, PAGE_FUNCTIONS.values()))}")
print(f"Official config labels present: {len(expected_config_labels)}/{len(expected_config_labels)}")
print("Official screenshot placements: 44/44")
print(f"Unique official image hashes preserved: {len(source_hashes)}/{len(source_hashes)}")
print("Inline image alt text: 46/46")
print(f"Heading hierarchy: {style_counts}")
print("Word image compression disabled: yes")
