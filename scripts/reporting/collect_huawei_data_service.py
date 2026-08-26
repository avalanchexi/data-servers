from __future__ import annotations

import hashlib
import json
import mimetypes
import re
import time
import urllib.parse
import urllib.request
from collections import deque
from pathlib import Path

from lxml import html


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / ".tmp" / "huawei-data-service-report"
IMAGE_DIR = OUT / "page-images"
RAW_DIR = OUT / "html"
START_URL = (
    "https://support.huaweicloud.com/intl/zh-cn/"
    "usermanual-dataartsstudio/dataartsstudio_01_0300.html"
)
ALLOWED_PREFIX = (
    "https://support.huaweicloud.com/intl/zh-cn/"
    "usermanual-dataartsstudio/"
)
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
)


def fetch(url: str, retries: int = 3) -> tuple[bytes, str]:
    error: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=45) as response:
                return response.read(), response.headers.get("Content-Type", "")
        except Exception as exc:  # pragma: no cover - live network retry
            error = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {error}")


def clean_text(node) -> str:
    return re.sub(r"\s+", " ", " ".join(node.itertext())).strip()


def page_id(url: str) -> str:
    return Path(urllib.parse.urlsplit(url).path).stem


def collect_blocks(content_root) -> list[dict[str, object]]:
    blocks: list[dict[str, object]] = []
    seen: set[tuple[str, str]] = set()
    for node in content_root.xpath(
        ".//h1 | .//h2 | .//h3 | .//h4 | .//p | .//table | "
        ".//ul[not(ancestor::li)] | .//ol[not(ancestor::li)]"
    ):
        if node.xpath(
            "ancestor::*[contains(concat(' ', normalize-space(@class), ' '), "
            "' help-detail-feedback ') or contains(concat(' ', normalize-space(@class), ' '), "
            "' relevant-content ') or contains(concat(' ', normalize-space(@class), ' '), "
            "' crumbs ') or contains(concat(' ', normalize-space(@class), ' '), "
            "' updateTime ')]"
        ):
            continue
        tag = node.tag.lower()
        if tag == "table":
            rows: list[list[str]] = []
            for tr in node.xpath(".//tr"):
                cells = [clean_text(cell) for cell in tr.xpath("./th|./td")]
                if any(cells):
                    rows.append(cells)
            if rows:
                key = ("table", json.dumps(rows, ensure_ascii=False))
                if key not in seen:
                    blocks.append({"type": "table", "rows": rows})
                    seen.add(key)
            continue
        if tag in {"ul", "ol"}:
            items = [clean_text(li) for li in node.xpath("./li")]
            items = [item for item in items if item]
            if items:
                key = (tag, "\n".join(items))
                if key not in seen:
                    blocks.append({"type": tag, "items": items})
                    seen.add(key)
            continue
        text = clean_text(node)
        if not text:
            continue
        kind = tag if tag in {"h1", "h2", "h3", "h4"} else "p"
        key = (kind, text)
        if key not in seen:
            blocks.append({"type": kind, "text": text})
            seen.add(key)
    return blocks


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    queue: deque[tuple[str, str | None, int]] = deque([(START_URL, None, 0)])
    queued = {START_URL}
    visited: set[str] = set()
    pages: list[dict[str, object]] = []
    image_hashes: dict[str, str] = {}

    while queue:
        url, parent, depth = queue.popleft()
        if url in visited:
            continue
        visited.add(url)
        raw, _ = fetch(url)
        pid = page_id(url)
        (RAW_DIR / f"{pid}.html").write_bytes(raw)
        doc = html.fromstring(raw.decode("utf-8"), base_url=url)
        title_nodes = doc.xpath("//h1[contains(@class, 'topictitle1')]")
        title = clean_text(title_nodes[0]) if title_nodes else pid
        update_nodes = doc.xpath("//span[contains(@class, 'updateInfo')]")
        updated = clean_text(update_nodes[0]) if update_nodes else ""
        content_nodes = doc.xpath("//div[contains(@class, 'help-center-document')]")
        content_root = content_nodes[0] if content_nodes else doc

        children: list[str] = []
        for anchor in content_root.xpath(
            ".//ul[contains(@class, 'ullinks')]//li[contains(@class, 'ulchildlink')]//a[@href]"
        ):
            child = urllib.parse.urljoin(url, anchor.get("href"))
            if child.startswith(ALLOWED_PREFIX):
                child = child.split("#", 1)[0]
                children.append(child)
                if child not in queued:
                    queue.append((child, url, depth + 1))
                    queued.add(child)

        images: list[dict[str, object]] = []
        image_nodes = content_root.xpath(
            ".//img[contains(@class, 'imgResize') or contains(@title, '点击放大')]"
        )
        for index, image_node in enumerate(image_nodes, start=1):
            source = image_node.get("src") or image_node.get("data-src")
            if not source:
                continue
            source = urllib.parse.urljoin(url, source)
            blob, content_type = fetch(source)
            digest = hashlib.sha256(blob).hexdigest()
            if digest in image_hashes:
                filename = image_hashes[digest]
            else:
                suffix = Path(urllib.parse.urlsplit(source).path).suffix.lower()
                if suffix not in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
                    suffix = mimetypes.guess_extension(content_type.split(";", 1)[0]) or ".bin"
                filename = f"{pid}-{index:02d}{suffix}"
                (IMAGE_DIR / filename).write_bytes(blob)
                image_hashes[digest] = filename
            caption = ""
            parent_node = image_node.getparent()
            if parent_node is not None:
                previous = parent_node.getprevious()
                if previous is not None and previous.tag.lower() in {"p", "div"}:
                    previous_text = clean_text(previous)
                    if previous_text.startswith(("图", "Image")):
                        caption = previous_text
            images.append(
                {
                    "url": source,
                    "file": filename,
                    "caption": caption,
                    "alt": image_node.get("alt") or "",
                    "title": image_node.get("title") or "",
                    "sha256": digest,
                }
            )

        pages.append(
            {
                "id": pid,
                "title": title,
                "url": url,
                "parent": page_id(parent) if parent else None,
                "depth": depth,
                "updated": updated,
                "children": [page_id(child) for child in children],
                "blocks": collect_blocks(content_root),
                "images": images,
            }
        )
        print(
            f"{len(pages):02d} depth={depth} {pid} {title} images={len(images)}",
            flush=True,
        )

    inventory = {
        "source_root": START_URL,
        "collected_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "page_count": len(pages),
        "unique_image_count": len(image_hashes),
        "pages": pages,
    }
    (OUT / "inventory.json").write_text(
        json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"pages={len(pages)} unique_images={len(image_hashes)}")


if __name__ == "__main__":
    main()
