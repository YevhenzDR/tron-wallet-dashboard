#!/usr/bin/env python3
"""
Fetch public address tags (e.g. "Binance-Hot 7", "WhiteBIT") from the
Tronscan API for every counterparty in data/wallet_data.json, classify
exchange vs regular wallets, and merge the results back into
data/wallet_data.json.

Sequential and rate-limit aware (the API 429s under concurrency).
Addresses are fetched in descending volume order so the biggest
counterparties are tagged first. Results are cached incrementally in
data/address_tags.json, so the script can be interrupted and re-run.

Usage:
    python3 scripts/fetch_tags.py           # fetch + merge
    python3 scripts/fetch_tags.py --merge   # merge cache only, no fetching
"""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "wallet_data.json"
CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / "address_tags.json"
WALLET = "TT3whB9h4rcvVPfxmnGNEsjvvgUHNox5iL"

API = "https://apilist.tronscan.org/api/account?address={}"
DELAY_S = 1.4
RATE_LIMIT_SLEEP_S = 90
MAX_RATE_LIMIT_RETRIES = 5

# Keywords that mark a public tag as belonging to a centralized exchange.
EXCHANGE_KEYWORDS = [
    "binance", "okx", "okex", "bybit", "kucoin", "htx", "huobi", "kraken",
    "gate.io", "gate-", "mexc", "bitget", "whitebit", "bitfinex", "poloniex",
    "coinex", "bittrex", "crypto.com", "upbit", "bithumb", "lbank", "xt.com",
    "bitmart", "bingx", "coinw", "hotcoin", "weex", "deepcoin", "pionex",
    "bitkub", "coinbase", "bitstamp", "bit2me", "latoken", "phemex",
    "exchange", "probit", "bitrue", "tokocrypto", "indodax",
]

# Tags that are exchanges but too short/ambiguous for substring matching:
# match on the first word of the tag instead ("Gate 3" -> "gate").
EXCHANGE_EXACT_WORDS = {"gate", "mxc", "htx", "okx", "bc.game"}


def is_exchange_tag(tag: str) -> bool:
    t = tag.lower()
    if any(k in t for k in EXCHANGE_KEYWORDS):
        return True
    words = t.replace(":", " ").split()
    return bool(words) and words[0] in EXCHANGE_EXACT_WORDS


def fetch_tag(address: str) -> str:
    for attempt in range(MAX_RATE_LIMIT_RETRIES):
        req = urllib.request.Request(
            API.format(address), headers={"User-Agent": "Mozilla/5.0"}
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                d = json.load(r)
            return d.get("addressTag", "") or ""
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"  429 rate limited, sleeping {RATE_LIMIT_SLEEP_S}s...", flush=True)
                time.sleep(RATE_LIMIT_SLEEP_S)
                continue
            raise
    raise RuntimeError(f"still rate limited after {MAX_RATE_LIMIT_RETRIES} retries")


def merge(data: dict, cache: dict) -> None:
    def enrich(rows):
        for r in rows:
            tag = cache.get(r["address"], "")
            r["tag"] = tag
            r["is_exchange"] = is_exchange_tag(tag)

    enrich(data["sources"])
    enrich(data["destinations"])
    enrich(data["circular_counterparties"])
    data["kpis"]["wallet_address"] = WALLET
    data["kpis"]["wallet_tag"] = cache.get(WALLET, "")
    data["kpis"]["exchange_source_count"] = sum(1 for s in data["sources"] if s["is_exchange"])
    data["kpis"]["exchange_destination_count"] = sum(
        1 for d in data["destinations"] if d["is_exchange"]
    )


def main():
    data = json.loads(DATA_PATH.read_text())

    # Highest combined volume first, so partial runs cover what the UI shows.
    volume: dict[str, float] = {WALLET: float("inf")}
    for s in data["sources"]:
        volume[s["address"]] = volume.get(s["address"], 0) + s["total"]
    for d in data["destinations"]:
        volume[d["address"]] = volume.get(d["address"], 0) + d["total"]
    addresses = sorted(volume, key=lambda a: -volume[a])

    cache: dict[str, str] = {}
    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text())

    if "--merge" not in sys.argv:
        todo = [a for a in addresses if a not in cache]
        print(f"{len(addresses)} addresses, {len(cache)} cached, {len(todo)} to fetch", flush=True)
        for i, addr in enumerate(todo, 1):
            try:
                cache[addr] = fetch_tag(addr)
            except Exception as e:
                print(f"  FAILED {addr}: {e}", flush=True)
            if i % 20 == 0 or i == len(todo):
                CACHE_PATH.write_text(json.dumps(cache, indent=1, sort_keys=True))
                tagged = sum(1 for v in cache.values() if v)
                print(f"  {i}/{len(todo)} fetched ({tagged} tagged)", flush=True)
            time.sleep(DELAY_S)

    tagged = {a: t for a, t in cache.items() if t}
    print(f"\nTagged: {len(tagged)} of {len(cache)} fetched", flush=True)
    for a, t in sorted(tagged.items(), key=lambda kv: kv[1].lower()):
        marker = "EXCHANGE " if is_exchange_tag(t) else "other-tag"
        print(f"  [{marker}] {t:32} {a}", flush=True)

    merge(data, cache)
    DATA_PATH.write_text(json.dumps(data, indent=2))
    print(
        f"\nMerged into {DATA_PATH}\n"
        f"Exchange sources: {data['kpis']['exchange_source_count']}, "
        f"exchange destinations: {data['kpis']['exchange_destination_count']}",
        flush=True,
    )


if __name__ == "__main__":
    main()
