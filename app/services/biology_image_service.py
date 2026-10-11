import json
import logging
from pathlib import Path
from typing import List, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent          # app/
DATA_DIR = BASE_DIR / "data"
IMAGES_DIR = DATA_DIR / "images"
METADATA_FILE = DATA_DIR / "image_metadata.json"

# Loaded once at module level
_local_metadata: Optional[List[dict]] = None


def _load_metadata() -> List[dict]:
    global _local_metadata
    if _local_metadata is not None:
        return _local_metadata
    if not METADATA_FILE.exists():
        logger.warning(f"Biology image metadata not found at {METADATA_FILE}. Local search disabled.")
        _local_metadata = []
        return _local_metadata
    try:
        with METADATA_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
        _local_metadata = data if isinstance(data, list) else []
        logger.info(f"Loaded {len(_local_metadata)} biology image metadata entries.")
    except Exception as e:
        logger.warning(f"Failed to load biology image metadata: {e}")
        _local_metadata = []
    return _local_metadata


def search_local_images(keywords: List[str], diagram_name: str, limit: int = 3) -> List[str]:
    """
    Searches the local image pool using diagram_name and keywords.
    Returns a list of relative HTTP paths (/data/images/<filename>) for matched images.
    Up to `limit` results.
    """
    metadata = _load_metadata()
    if not metadata:
        return []

    # Build a single normalised query string from name + keywords
    query_terms = set()
    for kw in ([diagram_name] + (keywords or [])):
        query_terms.update(kw.strip().casefold().split())

    results: List[str] = []
    for item in metadata:
        if not isinstance(item, dict):
            continue

        title = str(item.get("title", "")).casefold()
        item_subject = str(item.get("subject", "")).casefold()
        tags = [str(t).casefold() for t in item.get("tags", []) if t]
        searchable = " ".join([title, item_subject] + tags)

        # Score: count how many query terms appear in searchable text
        score = sum(1 for term in query_terms if term in searchable)
        if score == 0:
            continue

        filename = item.get("filename", "")
        if not filename or Path(filename).name != filename:
            continue

        image_path = IMAGES_DIR / filename
        if not image_path.is_file():
            logger.debug(f"Local image file missing: {image_path}")
            continue

        # Return a static URL path served by the FastAPI static mount
        results.append(f"/data/images/{filename}")
        if len(results) >= limit:
            break

    logger.info(f"Local image search for '{diagram_name}' returned {len(results)} result(s).")
    return results


async def search_serpapi_images(diagram_name: str, keywords: List[str], limit: int = 3) -> List[str]:
    """
    Falls back to SerpAPI Google Images search when local pool has no match.
    Returns up to `limit` thumbnail URLs.
    """
    api_key = settings.SERPAPI_API_KEY
    if not api_key:
        logger.warning("SERPAPI_API_KEY not configured. Skipping SerpAPI image search.")
        return []

    query = diagram_name
    if keywords:
        query = f"{diagram_name} {' '.join(keywords[:3])}"

    params = {
        "engine": "google_images",
        "q": query.strip(),
        "api_key": api_key,
        "hl": "en",
        "gl": "in",
        "num": str(limit * 3),  # fetch more, pick best
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get("https://serpapi.com/search.json", params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        logger.warning(f"SerpAPI timeout for query: '{query}'")
        return []
    except Exception as e:
        logger.warning(f"SerpAPI request failed for query '{query}': {e}")
        return []

    if data.get("error"):
        logger.warning(f"SerpAPI error: {data['error']}")
        return []

    urls: List[str] = []
    for item in data.get("images_results", []):
        url = item.get("thumbnail") or item.get("original")
        if url:
            urls.append(url)
        if len(urls) >= limit:
            break

    logger.info(f"SerpAPI returned {len(urls)} image(s) for '{query}'.")
    return urls


async def resolve_biology_diagram_links(
    diagram_name: str,
    keywords: List[str],
    limit: int = 3
) -> List[str]:
    """
    Primary entry point for biology image resolution.
    1. Check local image pool first.
    2. Fall back to SerpAPI if no local match.
    Returns up to `limit` image URLs.
    """
    # 1. Local search
    local_results = search_local_images(keywords=keywords, diagram_name=diagram_name, limit=limit)
    if local_results:
        return local_results[:limit]

    # 2. SerpAPI fallback
    serpapi_results = await search_serpapi_images(
        diagram_name=diagram_name,
        keywords=keywords,
        limit=limit
    )
    return serpapi_results[:limit]
