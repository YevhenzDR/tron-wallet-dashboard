#!/usr/bin/env python3
"""
Merge MistTrack's per-address risk/label data (data/misttrack_risk.json)
into wallet_data.json, transactions.json, and destination_traces.json.

Tronscan tags take priority where they exist (more specific, e.g.
"Binance-Hot 7"); MistTrack's address_label fills the gap otherwise
(generic, e.g. "binance"). Also attaches risk_level/is_high_risk so the
UI can flag High/Severe-risk counterparties.

Usage:
    python3 scripts/merge_misttrack.py
"""
import importlib.util
import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
WALLET_DATA_PATH = DATA_DIR / "wallet_data.json"
TRANSACTIONS_PATH = DATA_DIR / "transactions.json"
TRACES_PATH = DATA_DIR / "destination_traces.json"
TRONSCAN_TAGS_PATH = DATA_DIR / "address_tags.json"
MISTTRACK_PATH = DATA_DIR / "misttrack_risk.json"

spec = importlib.util.spec_from_file_location(
    "fetch_tags", Path(__file__).resolve().parent / "fetch_tags.py"
)
fetch_tags = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetch_tags)
is_exchange_tag = fetch_tags.is_exchange_tag


def load(path, default):
    if path.exists():
        return json.loads(path.read_text())
    return default


def main():
    tronscan_tags = load(TRONSCAN_TAGS_PATH, {})
    misttrack = load(MISTTRACK_PATH, {})

    def combined_tag(addr: str):
        t_tag = tronscan_tags.get(addr, "")
        if t_tag:
            return t_tag, is_exchange_tag(t_tag)
        m_label = misttrack.get(addr, {}).get("address_label", "")
        if m_label:
            label = m_label.strip()
            display = label if label.startswith("@") else label.title()
            return display, is_exchange_tag(label)
        return "", False

    def risk_info(addr: str):
        level = misttrack.get(addr, {}).get("risk_level", "")
        return level, level in ("High", "Severe")

    def enrich(rows):
        for r in rows:
            tag, is_exchange = combined_tag(r["address"])
            level, high_risk = risk_info(r["address"])
            r["tag"] = tag
            r["is_exchange"] = is_exchange
            r["risk_level"] = level
            r["is_high_risk"] = high_risk

    # --- wallet_data.json ---
    wallet_data = json.loads(WALLET_DATA_PATH.read_text())
    enrich(wallet_data["sources"])
    enrich(wallet_data["destinations"])
    enrich(wallet_data["circular_counterparties"])

    wallet = wallet_data["kpis"]["wallet_address"]
    wallet_tag, _ = combined_tag(wallet)
    wallet_data["kpis"]["wallet_tag"] = wallet_tag
    wallet_data["kpis"]["exchange_source_count"] = sum(
        1 for s in wallet_data["sources"] if s["is_exchange"]
    )
    wallet_data["kpis"]["exchange_destination_count"] = sum(
        1 for d in wallet_data["destinations"] if d["is_exchange"]
    )
    high_risk_sources = sum(1 for s in wallet_data["sources"] if s["is_high_risk"])
    high_risk_destinations = sum(1 for d in wallet_data["destinations"] if d["is_high_risk"])
    wallet_data["kpis"]["high_risk_source_count"] = high_risk_sources
    wallet_data["kpis"]["high_risk_destination_count"] = high_risk_destinations

    WALLET_DATA_PATH.write_text(json.dumps(wallet_data, indent=2))
    print(
        f"wallet_data.json: exchange sources {wallet_data['kpis']['exchange_source_count']}, "
        f"exchange destinations {wallet_data['kpis']['exchange_destination_count']}, "
        f"high-risk sources {high_risk_sources}, high-risk destinations {high_risk_destinations}"
    )

    # --- transactions.json (ledger) ---
    if TRANSACTIONS_PATH.exists():
        ledger = json.loads(TRANSACTIONS_PATH.read_text())
        for t in ledger["transactions"]:
            tag, is_exchange = combined_tag(t["counterparty"])
            level, high_risk = risk_info(t["counterparty"])
            t["tag"] = tag
            t["is_exchange"] = is_exchange
            t["risk_level"] = level
            t["is_high_risk"] = high_risk
        TRANSACTIONS_PATH.write_text(json.dumps(ledger, indent=1))
        print(f"transactions.json: re-tagged {len(ledger['transactions'])} rows")

    # --- destination_traces.json (one-hop targets) ---
    if TRACES_PATH.exists():
        traces = json.loads(TRACES_PATH.read_text())
        for entry in traces["traced"]:
            exchange_out_total = 0.0
            for target in entry["top_targets"]:
                tag, is_exchange = combined_tag(target["address"])
                level, high_risk = risk_info(target["address"])
                target["tag"] = tag
                target["is_exchange"] = is_exchange
                target["risk_level"] = level
                target["is_high_risk"] = high_risk
                if is_exchange:
                    exchange_out_total += target["total"]
            entry["exchange_out_total"] = round(exchange_out_total, 6)
        traces["summary"]["addresses_with_known_exchange_hits"] = sum(
            1 for e in traces["traced"] if e["exchange_out_total"] > 0
        )
        traces["summary"]["total_exchange_hit_volume"] = round(
            sum(e["exchange_out_total"] for e in traces["traced"]), 6
        )
        TRACES_PATH.write_text(json.dumps(traces, indent=2))
        print(
            f"destination_traces.json: {traces['summary']['addresses_with_known_exchange_hits']} "
            f"addresses with exchange hits, {traces['summary']['total_exchange_hit_volume']:.2f} USDT total"
        )


if __name__ == "__main__":
    main()
