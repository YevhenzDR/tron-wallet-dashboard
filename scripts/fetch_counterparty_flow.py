#!/usr/bin/env python3
"""
Fetch MistTrack's clustered counterparty fund-flow (the "where did the
money end up" view) for the investigated wallet and its top destinations.

MistTrack's /v1/address_counterparty does its own multi-hop entity
clustering and returns, per address, the distribution of funds across
named entities (exchanges, mixers, etc.) plus an "Unknown" remainder --
i.e. one call per address gives the aggregated cash-out picture.

Requires the mobile-data network to reach openapi.misttrack.io.
Results cached to data/counterparty_flow.json (resumable).

Usage:
    python3 scripts/fetch_counterparty_flow.py [--top N]
"""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
WALLET_DATA_PATH = DATA_DIR / "wallet_data.json"
OUT_PATH = DATA_DIR / "counterparty_flow.json"

API_KEY = "ac250G8L6HSsPXKdtEJ3nClMe1OFDIwb"
URL = "https://openapi.misttrack.io/v1/address_counterparty?coin=TRX&address={addr}&api_key=" + API_KEY
DELAY_S = 1.3
MAX_RETRIES = 3
RETRY_SLEEP_S = 5


def fetch(addr: str):
    for attempt in range(MAX_RETRIES):
        req = urllib.request.Request(URL.format(addr=addr), headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                body = json.load(r)
            if not body.get("success"):
                return {"error": body.get("msg", "unknown")}
            return {"counterparties": body.get("address_counterparty_list", [])}
        except (urllib.error.URLError, TimeoutError) as e:
            print(f"    retry {attempt + 1}/{MAX_RETRIES} for {addr}: {e}", flush=True)
            time.sleep(RETRY_SLEEP_S)
    return {"error": "failed after retries"}


def main():
    top_n = 20
    if "--top" in sys.argv:
        top_n = int(sys.argv[sys.argv.index("--top") + 1])

    wd = json.loads(WALLET_DATA_PATH.read_text())
    wallet = wd["kpis"]["wallet_address"]
    top_destinations = sorted(wd["destinations"], key=lambda d: -d["total"])[:top_n]

    cache = {}
    if OUT_PATH.exists():
        cache = json.loads(OUT_PATH.read_text())

    todo = []
    if wallet not in cache:
        todo.append(("wallet", wallet, None))
    for d in top_destinations:
        if d["address"] not in cache:
            todo.append(("destination", d["address"], d["total"]))

    print(f"{len(todo)} addresses to fetch (wallet + top {top_n} destinations)", flush=True)
    for i, (role, addr, received) in enumerate(todo, 1):
        res = fetch(addr)
        res["role"] = role
        if received is not None:
            res["received_from_wallet"] = received
        cache[addr] = res
        n = len(res.get("counterparties", []))
        print(f"  [{i}/{len(todo)}] {role} {addr[:14]}.. -> {n} counterparties", flush=True)
        OUT_PATH.write_text(json.dumps(cache, indent=1))
        time.sleep(DELAY_S)

    print(f"\nWrote {OUT_PATH} ({len(cache)} addresses cached)", flush=True)


if __name__ == "__main__":
    main()
