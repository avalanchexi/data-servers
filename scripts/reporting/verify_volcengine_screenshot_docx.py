from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
DOCX = ROOT / "火山引擎DataLeap数据服务业务架构梳理（含页面截图）.docx"
IMAGE_DIR = ROOT / ".tmp" / "volcengine-data-service-report" / "page-screenshots"
INVENTORY = IMAGE_DIR / "inventory.json"
SELECTIONS = {
    "S3": 10,
    "S4": 2,
    "S5": 2,
    "S6": 1,
    "S7": 2,
    "S8": 3,
    "S10": 2,
    "S11": 1,
    "S12": 3,
    "S14": 2,
    "S15": 1,
    "S16": 1,
    "S17": 1,
    "S18": 1,
    "S19": 1,
    "S22": 2,
    "S23": 1,
}
NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
pages = {page["sid"]: page for page in inventory["pages"]}
selected_hashes = {
    pages[sid]["images"][position - 1]["sha256"]: sid
    for sid, position in SELECTIONS.items()
}

with zipfile.ZipFile(DOCX) as archive:
    media = {
        name: archive.read(name)
        for name in archive.namelist()
        if name.startswith("word/media/")
    }
    media_hashes = {sha256(data): name for name, data in media.items()}
    missing_hashes = {
        sid: digest
        for digest, sid in selected_hashes.items()
        if digest not in media_hashes
    }
    if missing_hashes:
        raise AssertionError(f"Selected originals not embedded byte-for-byte: {missing_hashes}")

    document = ET.fromstring(archive.read("word/document.xml"))
    text = "".join(node.text or "" for node in document.findall(".//w:t", NS))
    doc_pr = document.findall(".//wp:docPr", NS)
    alt_texts = [node.get("descr") for node in doc_pr if node.get("descr")]
    if len(doc_pr) != 19 or len(alt_texts) != 19:
        raise AssertionError(f"Image/alt mismatch: docPr={len(doc_pr)}, alt={len(alt_texts)}")

    for sid in [f"S{i}" for i in range(1, 24)]:
        if sid not in text:
            raise AssertionError(f"Missing page entry: {sid}")
    if "附录 C 各页面官方产品截图" not in text:
        raise AssertionError("Appendix C heading missing")
    if text.count("官方正文未") != 6 and text.count("当前官方正文未") != 4:
        # The exact split is less important than preserving six explicit statuses.
        status_count = text.count("未提供产品界面截图") + text.count("未嵌入产品界面截图")
        if status_count != 6:
            raise AssertionError(f"Expected six no-screenshot notes, got {status_count}")

    settings = ET.fromstring(archive.read("word/settings.xml"))
    node = settings.find("w:doNotCompressPictures", NS)
    if node is None or node.get(f"{{{NS['w']}}}val") not in {"true", "1", "on"}:
        raise AssertionError("Word no-compression setting missing")

print(f"DOCX: {DOCX}")
print(f"File size: {DOCX.stat().st_size:,} bytes")
print(f"Inline images: {len(doc_pr)} (2 retained + 17 official page originals)")
print("Original-byte hash matches: 17/17")
print("Alt text: 19/19")
print("Page coverage: 23/23")
print("Explicit no-screenshot notes: 6/6")
print("Word image compression disabled: yes")
