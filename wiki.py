"""
wiki.py — Wikipedia Intelligence Layer for Catura AI
=====================================================
Provides fast, hallucination-free answers for educational,
informational, historical, scientific, biography, and concept
questions using the free Wikimedia REST API (no API key needed).

Pipeline:
  1. Search Wikipedia for best matching article
  2. Fetch article summary (extract + key facts)
  3. Return clean context string for AI prompt injection
  4. Caller decides whether to fallback to web_search

APIs used (no auth required):
  Search  : https://en.wikipedia.org/w/rest.php/v1/search/page
  Summary : https://en.wikipedia.org/api/rest_v1/page/summary/{title}
"""

import requests
import re

# ── Constants ──────────────────────────────────────────────────────────────────
WIKI_SEARCH_URL  = "https://en.wikipedia.org/w/rest.php/v1/search/page"
WIKI_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
WIKI_HEADERS     = {
    "User-Agent": "CaturaAI/1.0 (educational AI assistant; python-requests)",
    "Accept":     "application/json",
}
REQUEST_TIMEOUT  = 6   # seconds — keep it snappy

# Minimum extract length to be considered a useful result
MIN_EXTRACT_LEN  = 80

# Maximum characters of Wikipedia extract we send to the AI
# (keeps token usage light while giving full context for simple questions)
MAX_EXTRACT_CHARS = 1800


# ── Quality gate: topics Wikipedia is NOT good for ────────────────────────────
# If the question is clearly real-time or opinion-based, skip Wikipedia entirely.
_SKIP_WIKI_PATTERNS = [
    r'\b(today|right now|currently|live|latest|breaking|just now|this moment)\b',
    r'\b(price|stock|share|nifty|sensex|crypto|bitcoin|weather|temperature)\b',
    r'\b(score|match score|who (won|is winning)|ipl today)\b',
    r'\b(news|headlines|happened today|recent news)\b',
    r'\bhow (much|many).*(cost|price|rupee|dollar)\b',
    r'\bmy (name|age|location|city)\b',
    r'\b(code|program|debug|fix|error|implement|build|create) (this|the|a|my)\b',
]

def should_skip_wikipedia(query: str) -> bool:
    """Return True if the query is clearly not suitable for Wikipedia."""
    lower = query.lower()
    return any(re.search(p, lower) for p in _SKIP_WIKI_PATTERNS)


# ── Step 1: Search ─────────────────────────────────────────────────────────────
def _search_wikipedia(query: str) -> str | None:
    """
    Call the Wikimedia search API and return the title of the best match.
    Returns None if nothing found or on error.
    """
    try:
        resp = requests.get(
            WIKI_SEARCH_URL,
            params={"q": query, "limit": 1},
            headers=WIKI_HEADERS,
            timeout=REQUEST_TIMEOUT,
        )
        if resp.status_code != 200:
            print(f"⚠️ [Wiki] search HTTP {resp.status_code} for: {query[:60]}")
            return None

        pages = resp.json().get("pages", [])
        if not pages:
            print(f"ℹ️ [Wiki] no search results for: {query[:60]}")
            return None

        title = pages[0].get("title")
        print(f"🔎 [Wiki] search hit: '{query[:50]}' → '{title}'")
        return title

    except Exception as e:
        print(f"❌ [Wiki] search exception: {e}")
        return None


# ── Step 2: Fetch summary ──────────────────────────────────────────────────────
def _fetch_summary(title: str) -> dict | None:
    """
    Fetch the Wikimedia page summary for a given article title.
    Returns a dict with extract, description, coordinates, etc.
    Returns None on error or if extract is too short to be useful.
    """
    try:
        url  = WIKI_SUMMARY_URL.format(title=requests.utils.quote(title, safe=""))
        resp = requests.get(url, headers=WIKI_HEADERS, timeout=REQUEST_TIMEOUT)

        if resp.status_code != 200:
            print(f"⚠️ [Wiki] summary HTTP {resp.status_code} for: {title}")
            return None

        data    = resp.json()
        extract = data.get("extract", "").strip()

        if len(extract) < MIN_EXTRACT_LEN:
            print(f"ℹ️ [Wiki] extract too short ({len(extract)} chars) for: {title}")
            return None

        return data

    except Exception as e:
        print(f"❌ [Wiki] summary exception: {e}")
        return None


# ── Step 3: Format context for AI injection ────────────────────────────────────
def _format_context(title: str, data: dict) -> str:
    """
    Convert raw Wikipedia summary JSON into a clean, token-efficient
    context string for injection into the AI system prompt.
    """
    extract     = data.get("extract", "").strip()
    description = data.get("description", "").strip()
    page_url    = data.get("content_urls", {}).get("desktop", {}).get("page", "")

    # Truncate extract to keep tokens light
    if len(extract) > MAX_EXTRACT_CHARS:
        # Cut at last sentence boundary within limit
        trimmed = extract[:MAX_EXTRACT_CHARS]
        last_dot = trimmed.rfind(". ")
        if last_dot > MAX_EXTRACT_CHARS * 0.6:
            trimmed = trimmed[: last_dot + 1]
        extract = trimmed + " [...]"

    lines = [
        f"📖 WIKIPEDIA CONTEXT — {title}",
        f"Description: {description}" if description else "",
        "",
        extract,
        "",
        f"Source: {page_url}" if page_url else "",
    ]

    context = "\n".join(l for l in lines if l is not None)
    return context.strip()


# ── Public API ─────────────────────────────────────────────────────────────────
def search_wikipedia(query: str) -> dict:
    """
    Main entry point. Search Wikipedia for the query and return a result dict.

    Returns:
        {
          "found":   True,
          "title":   str,
          "context": str,   ← inject this into the AI system prompt
          "tool":    "wikipedia"
        }
        OR
        {
          "found":  False,
          "reason": str,    ← "skip" | "no_result" | "short_extract" | "error"
          "tool":   "wikipedia"
        }
    """
    print(f"📚 [Wiki] query: {query[:80]}")

    # Fast-skip check — don't waste a round-trip for real-time questions
    if should_skip_wikipedia(query):
        print(f"⏩ [Wiki] skipping (real-time/not suitable): {query[:60]}")
        return {"found": False, "reason": "skip", "tool": "wikipedia"}

    # Step 1: Search
    title = _search_wikipedia(query)
    if not title:
        return {"found": False, "reason": "no_result", "tool": "wikipedia"}

    # Step 2: Fetch summary
    data = _fetch_summary(title)
    if not data:
        return {"found": False, "reason": "short_extract", "tool": "wikipedia"}

    # Step 3: Build context
    context = _format_context(title, data)
    print(f"✅ [Wiki] context ready: {len(context)} chars for '{title}'")

    return {
        "found":   True,
        "title":   title,
        "context": context,
        "tool":    "wikipedia",
    }
