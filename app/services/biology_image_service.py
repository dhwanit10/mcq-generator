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

# Generic words to exclude from keyword/metadata match calculation
STOP_WORDS = {
    "diagram", "structure", "system", "process", "types",
    "and", "the", "of", "in", "for", "a", "an", "stages",
    "anatomy", "function", "figure", "label", "labelled",
    "cycle", "human"
}

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
    Weights every entry in the local image pool against keywords and diagram_name.
    Only returns images whose keywords / diagram name match metadata with a positive score.
    Returns up to `limit` relative HTTP paths (/data/images/<filename>), sorted by score.
    If no relevant image matches, returns an empty list.
    """
    metadata = _load_metadata()
    if not metadata:
        return []

    norm_keywords = [
        kw.strip().casefold()
        for kw in (keywords or [])
        if kw and kw.strip().casefold() not in STOP_WORDS
    ]
    diag_clean = (diagram_name or "").strip().casefold()
    diag_tokens = [w for w in diag_clean.split() if w not in STOP_WORDS and len(w) > 2]

    scored_entries = []

    for item in metadata:
        if not isinstance(item, dict):
            continue

        filename = item.get("filename", "")
        if not filename or Path(filename).name != filename:
            continue

        image_path = IMAGES_DIR / filename
        if not image_path.is_file():
            continue

        title = str(item.get("title", "")).casefold()
        tags = [str(t).casefold() for t in item.get("tags", []) if t]
        tags_set = set(tags)
        title_tokens = [w for w in title.split() if w not in STOP_WORDS and len(w) > 2]

        score = 0

        # 1. Topic title matching
        if diag_clean == title:
            score += 20
        elif diag_clean and (diag_clean in title or title in diag_clean):
            score += 15
        else:
            title_overlap = set(diag_tokens) & set(title_tokens)
            if title_overlap:
                score += len(title_overlap) * 10

        # 2. Keyword matching with tags and title
        for kw in norm_keywords:
            if kw in tags_set:
                score += 6
            elif any(kw in t or t in kw for t in tags):
                score += 4
            elif kw in title:
                score += 5
            else:
                kw_words = [w for w in kw.split() if w not in STOP_WORDS and len(w) > 2]
                if kw_words and any(w in tags or w in title for w in kw_words):
                    score += 1

        # Must have a significant match score (>= 8) to be considered a genuine match
        if score >= 8:
            scored_entries.append((score, f"/data/images/{filename}"))

    # Sort descending by score
    scored_entries.sort(key=lambda x: x[0], reverse=True)
    results = [entry[1] for entry in scored_entries[:limit]]

    logger.info(f"Local image search for '{diagram_name}' returned {len(results)} scored result(s).")
    return results


async def search_serpapi_images(diagram_name: str, keywords: List[str], limit: int = 3) -> List[str]:
    """
    Searches SerpAPI using only the diagram name, inspects the top 7 Google Images results,
    matches keywords against each result's title/snippet/source, and returns the images with the most matches.
    If no result matches the keywords, returns an empty list.
    """
    api_key = settings.SERPAPI_API_KEY
    if not api_key:
        logger.warning("SERPAPI_API_KEY not configured. Skipping SerpAPI image search.")
        return []

    query = (diagram_name or "").strip()
    if not query:
        norm_kw = [k for k in (keywords or []) if k.casefold() not in STOP_WORDS]
        if norm_kw:
            query = " ".join(norm_kw[:2])
        else:
            return []

    params = {
        "engine": "google_images",
        "q": query,
        "api_key": api_key,
        "hl": "en",
        "gl": "in",
        "num": "10",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
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

    raw_candidates = data.get("images_results", [])
    if not raw_candidates:
        return []

    # Inspect the top 7 results
    top_7 = raw_candidates[:7]

    norm_keywords = [
        kw.strip().casefold()
        for kw in (keywords or [])
        if kw and kw.strip().casefold() not in STOP_WORDS
    ]
    diag_words = [w for w in query.casefold().split() if w not in STOP_WORDS and len(w) > 2]

    scored_images = []

    for item in top_7:
        url = item.get("thumbnail") or item.get("original")
        if not url:
            continue

        item_title = str(item.get("title", "")).casefold()
        item_snippet = str(item.get("snippet", "")).casefold()
        item_source = str(item.get("source", "")).casefold()
        corpus = f"{item_title} {item_snippet} {item_source}"

        score = 0
        for kw in norm_keywords:
            if kw in corpus:
                score += 3
            else:
                words = [w for w in kw.split() if w not in STOP_WORDS and len(w) > 2]
                if words and any(w in corpus for w in words):
                    score += 1

        for dw in diag_words:
            if dw in corpus:
                score += 2

        if score > 0:
            scored_images.append((score, url))

    # Sort images by match score in descending order
    scored_images.sort(key=lambda x: x[0], reverse=True)

    results = []
    seen = set()
    for _, url in scored_images:
        if url not in seen:
            seen.add(url)
            results.append(url)
        if len(results) >= limit:
            break

    logger.info(f"SerpAPI keyword matching for '{query}' returned {len(results)} image(s) from top 7.")
    return results


async def resolve_biology_diagram_links(
    diagram_name: str,
    keywords: List[str],
    limit: int = 3
) -> List[str]:
    """
    Primary entry point for biology image resolution.
    1. Check local image pool first using weighted search.
    2. If fewer than `limit` images are found locally (e.g. 1 found), query SerpAPI
       for the remaining images needed so the total reaches up to `limit` (default 3).
    3. If no images are found in either local or SerpAPI, returns an empty list [].
    """
    # 1. Local weighted search
    local_results = search_local_images(keywords=keywords, diagram_name=diagram_name, limit=limit)

    needed = limit - len(local_results)
    serpapi_results: List[str] = []

    # 2. Query SerpAPI for remaining needed images
    if needed > 0:
        serpapi_results = await search_serpapi_images(
            diagram_name=diagram_name,
            keywords=keywords,
            limit=needed
        )

    # 3. Combine and deduplicate
    combined: List[str] = []
    seen = set()
    for link in (local_results + serpapi_results):
        if link and link not in seen:
            seen.add(link)
            combined.append(link)
        if len(combined) >= limit:
            break

    # 4. Return combined images or empty list if none found
    return combined
