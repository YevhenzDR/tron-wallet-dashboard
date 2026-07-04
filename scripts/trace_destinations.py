#!/usr/bin/env python3
"""
One-hop forward trace: for the top USDT destinations of the investigated
wallet, pull their own outgoing USDT transfers and see where the money goes
next. This is the "where did it go after leaving the wallet" step.

Only reads transfer amounts from Tronscan (no new tag/label fetching --
that's deferred to the Arkham-based labeling pass). Any target address that
happens to already be in data/address_tags.json is flagged using the cached
tag, opportunistically, but nothing new is fetched for labeling here.

Usage:
    python3 scripts/trace_destinations.py [--top N]
"""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
WALLET_DATA_PATH = DATA_DIR / "wallet_data.json"
TAGS_CACHE_PATH = DATA_DIR / "address_tags.json"
OUT_PATH = DATA_DIR / "destination_traces.json"

USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
TRANSFERS_API = (
    "https://apilist.tronscan.org/api/token_trc20/transfers"
    "?limit=50&start={start}&sort=-timestamp&count=true"
    "&relatedAddress={address}&contract_address=" + USDT_CONTRACT
)
DELAY_S = 1.4
RATE_LIMIT_SLEEP_S = 90
MAX_RATE_LIMIT_RETRIES = 5
MAX_PAGES_PER_ADDRESS = 20  # 20 * 50 = up to 1000 transfers per address
TOP_TARGETS_PER_ADDRESS = 8

EXCHANGE_KEYWORDS = [
    "binance", "okx", "okex", "bybit", "kucoin", "htx", "huobi", "kraken",
    "gate.io", "gate-", "mexc", "bitget", "whitebit", "bitfinex", "poloniex",
    "coinex", "bittrex", "crypto.com", "upbit", "bithumb", "lbank", "xt.com",
    "bitmart", "bingx", "coinw", "hotcoin", "weex", "deepcoin", "pionex",
    "bitkub", "coinbase", "bitstamp", "bit2me", "latoken", "phemex",
    "exchange", "probit", "bitrue", "tokocrypto", "indodax", "cex.io",
]
EXCHANGE_EXACT_WORDS = {"gate", "mxc", "htx", "okx", "bc.game"}


def is_exchange_tag(tag: str) -> bool:
    t = tag.lower()
    if any(k in t for k in EXCHANGE_KEYWORDS):
        return True
    words = t.replace(":", " ").split()
    return bool(words) and words[0] in EXCHANGE_EXACT_WORDS


def fetch_page(address: str, start: int) -> dict:
    for attempt in range(MAX_RATE_LIMIT_RETRIES):
        req = urllib.request.Request(
            TRANSFERS_API.format(address=address, start=start),
            headers={"User-Agent": "Mozilla/5.0"},
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"    429 rate limited, sleeping {RATE_LIMIT_SLEEP_S}s...", flush=True)
                time.sleep(RATE_LIMIT_SLEEP_S)
                continue
            raise
    raise RuntimeError(f"still rate limited after {MAX_RATE_LIMIT_RETRIES} retries")


def trace_outgoing(address: str) -> dict:
    """Aggregate this address's outgoing USDT transfers by target address."""
    targets: dict[str, dict] = {}
    total = 0.0
    count = 0
    start = 0
    for page in range(MAX_PAGES_PER_ADDRESS):
        data = fetch_page(address, start)
        transfers = data.get("token_transfers", [])
        if not transfers:
            break
        for t in transfers:
            if t.get("from_address") != address:
                continue  # relatedAddress returns both directions; keep outgoing only
            to_addr = t.get("to_address")
            if not to_addr:
                continue
            amount = int(t.get("quant", 0)) / 1_000_000
            total += amount
            count += 1
            slot = targets.setdefault(to_addr, {"total": 0.0, "count": 0})
            slot["total"] += amount
            slot["count"] += 1
        if len(transfers) < 50:
            break
        start += 50
        time.sleep(DELAY_S)
    return {"total": total, "count": count, "targets": targets}


def main():
    top_n = 15
    if "--top" in sys.argv:
        top_n = int(sys.argv[sys.argv.index("--top") + 1])

    wallet_data = json.loads(WALLET_DATA_PATH.read_text())
    tags_cache: dict[str, str] = {}
    if TAGS_CACHE_PATH.exists():
        tags_cache = json.loads(TAGS_CACHE_PATH.read_text())

    top_destinations = sorted(wallet_data["destinations"], key=lambda d: -d["total"])[:top_n]
    print(f"Tracing {len(top_destinations)} top destinations one hop forward...", flush=True)

    traced = []
    for i, dest in enumerate(top_destinations, 1):
        addr = dest["address"]
        print(f"[{i}/{len(top_destinations)}] {addr} (received {dest['total']:.2f} USDT from wallet)", flush=True)
        try:
            result = trace_outgoing(addr)
        except Exception as e:
            print(f"  FAILED: {e}", flush=True)
            continue

        sorted_targets = sorted(result["targets"].items(), key=lambda kv: -kv[1]["total"])
        top_targets = []
        for target_addr, agg in sorted_targets[:TOP_TARGETS_PER_ADDRESS]:
            tag = tags_cache.get(target_addr, "")
            top_targets.append({
                "address": target_addr,
                "total": round(agg["total"], 6),
                "count": agg["count"],
                "tag": tag,
                "is_exchange": is_exchange_tag(tag) if tag else False,
            })

        exchange_out_total = sum(
            agg["total"] for a, agg in result["targets"].items()
            if is_exchange_tag(tags_cache.get(a, ""))
        )

        traced.append({
            "address": addr,
            "received_from_wallet": dest["total"],
            "total_out_all_time": round(result["total"], 6),
            "out_tx_count": result["count"],
            "unique_targets": len(result["targets"]),
            "exchange_out_total": round(exchange_out_total, 6),
            "top_targets": top_targets,
        })
        print(
            f"  -> {result['count']} outgoing tx, {len(result['targets'])} unique targets, "
            f"{exchange_out_total:.2f} USDT to known exchange addresses",
            flush=True,
        )
        time.sleep(DELAY_S)

    total_exchange_hit = sum(t["exchange_out_total"] for t in traced)
    traced_with_exchange_hits = sum(1 for t in traced if t["exchange_out_total"] > 0)

    output = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + "Z",
        "note": "Мітки взято лише з наявного кешу тегів Tronscan (без нового запиту для цих адрес). "
                "Повне маркування цього кроку буде виконано після інтеграції Arkham.",
        "traced": traced,
        "summary": {
            "addresses_traced": len(traced),
            "addresses_with_known_exchange_hits": traced_with_exchange_hits,
            "total_exchange_hit_volume": round(total_exchange_hit, 6),
        },
    }
    OUT_PATH.write_text(json.dumps(output, indent=2))
    print(f"\nWrote {OUT_PATH}", flush=True)
    print(
        f"Summary: {traced_with_exchange_hits}/{len(traced)} traced addresses show known-exchange "
        f"hits one hop forward, totaling {total_exchange_hit:.2f} USDT",
        flush=True,
    )


if __name__ == "__main__":
    main()
