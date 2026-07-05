#!/usr/bin/env python3
"""
Query MistTrack's v3 risk_score endpoint for every counterparty (and the
investigated wallet itself) in data/wallet_data.json. Unlike Tronscan's
flat public tags, this does multi-hop entity/risk attribution -- it can
surface sanctioned exchanges, illicit-activity flags, and intermediary
addresses even when they carry no public Tronscan tag.

Requires network access to openapi.misttrack.io, which may be blocked
from some networks/IPs -- run this where that host is reachable.

Results are cached incrementally in data/misttrack_risk.json so the
script can be interrupted and resumed.

Usage:
    python3 scripts/fetch_misttrack_risk.py
"""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
WALLET_DATA_PATH = DATA_DIR / "wallet_data.json"
CACHE_PATH = DATA_DIR / "misttrack_risk.json"

API_KEY = "ac250G8L6HSsPXKdtEJ3nClMe1OFDIwb"
API_URL = "https://openapi.misttrack.io/v3/risk_score?coin=TRX&address={address}&api_key=" + API_KEY

DELAY_S = 0.5
MAX_RETRIES = 3
RETRY_SLEEP_S = 5


def fetch_risk(address: str) -> dict | None:
    for attempt in range(MAX_RETRIES):
        req = urllib.request.Request(
            API_URL.format(address=address), headers={"User-Agent": "Mozilla/5.0"}
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                body = json.load(r)
            if not body.get("success"):
                return {"error": body.get("msg", "unknown error")}
            return body.get("data", {})
        except (urllib.error.URLError, TimeoutError) as e:
            print(f"    retry {attempt + 1}/{MAX_RETRIES} for {address}: {e}", flush=True)
            time.sleep(RETRY_SLEEP_S)
    return None


def collect_addresses(wallet_data: dict) -> list[str]:
    addrs = {wallet_data["kpis"]["wallet_address"]}
    for s in wallet_data["sources"]:
        addrs.add(s["address"])
    for d in wallet_data["destinations"]:
        addrs.add(d["address"])
    for c in wallet_data["circular_counterparties"]:
        addrs.add(c["address"])
    return sorted(addrs)


def main():
    wallet_data = json.loads(WALLET_DATA_PATH.read_text())
    addresses = collect_addresses(wallet_data)

    cache: dict[str, dict] = {}
    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text())

    todo = [a for a in addresses if a not in cache]
    print(f"{len(addresses)} addresses total, {len(cache)} cached, {len(todo)} to fetch", flush=True)

    for i, addr in enumerate(todo, 1):
        result = fetch_risk(addr)
        if result is not None:
            cache[addr] = result
        else:
            cache[addr] = {"error": "failed after retries"}

        if i % 25 == 0 or i == len(todo):
            CACHE_PATH.write_text(json.dumps(cache, indent=1))
            labeled = sum(1 for v in cache.values() if v.get("address_label"))
            flagged = sum(1 for v in cache.values() if v.get("risk_detail"))
            print(
                f"  {i}/{len(todo)} fetched (labeled: {labeled}, flagged: {flagged})",
                flush=True,
            )
        time.sleep(DELAY_S)

    labeled = sum(1 for v in cache.values() if v.get("address_label"))
    flagged = sum(1 for v in cache.values() if v.get("risk_detail"))
    high_risk = sum(1 for v in cache.values() if v.get("risk_level") in ("High", "Severe"))
    print(
        f"\nDone. {len(cache)} addresses cached: {labeled} with entity labels, "
        f"{flagged} with risk_detail hits, {high_risk} High/Severe risk level.",
        flush=True,
    )


if __name__ == "__main__":
    main()
