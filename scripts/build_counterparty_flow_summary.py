#!/usr/bin/env python3
"""
Turn MistTrack's per-address counterparty clustering (data/counterparty_flow.json)
into a "where did the money ultimately end up" summary.

IMPORTANT METHODOLOGY NOTE: MistTrack's address_counterparty endpoint returns
an address's ENTIRE lifetime fund distribution, not just the portion that
passed through from the investigated wallet. Top destination addresses are
themselves busy hubs with much larger total volume than what they received
from us. So we can't use the raw amounts directly -- instead we apply each
destination's own percentage breakdown to the known amount it received from
the investigated wallet, giving a proportional ESTIMATE of where that money
likely flowed next. This is stated explicitly in the output for the UI to
surface as a caveat.

Usage:
    python3 scripts/build_counterparty_flow_summary.py
"""
import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
FLOW_PATH = DATA_DIR / "counterparty_flow.json"
OUT_PATH = DATA_DIR / "counterparty_flow_summary.json"


def main():
    flow = json.loads(FLOW_PATH.read_text())

    wallet_entry = None
    destinations = []
    for addr, v in flow.items():
        if v.get("role") == "wallet":
            wallet_entry = {"address": addr, "counterparties": v.get("counterparties", [])}
        elif v.get("role") == "destination":
            destinations.append({
                "address": addr,
                "received_from_wallet": v.get("received_from_wallet", 0),
                "counterparties": v.get("counterparties", []),
            })

    destinations.sort(key=lambda d: -d["received_from_wallet"])

    total_received = sum(d["received_from_wallet"] for d in destinations)
    entity_totals: dict[str, float] = {}
    unattributed = 0.0

    per_destination = []
    for d in destinations:
        received = d["received_from_wallet"]
        breakdown = []
        for cp in d["counterparties"]:
            estimated = received * (cp["percent"] / 100)
            breakdown.append({
                "name": cp["name"],
                "estimated_amount": round(estimated, 6),
                "source_percent": cp["percent"],
            })
            if cp["name"] == "Unknown":
                unattributed += estimated
            else:
                entity_totals[cp["name"]] = entity_totals.get(cp["name"], 0) + estimated
        breakdown.sort(key=lambda x: -x["estimated_amount"])
        per_destination.append({
            "address": d["address"],
            "received_from_wallet": received,
            "breakdown": breakdown,
        })

    entities = sorted(
        [{"name": k, "estimated_amount": round(v, 6)} for k, v in entity_totals.items()],
        key=lambda x: -x["estimated_amount"],
    )
    known_total = sum(e["estimated_amount"] for e in entities)

    output = {
        "method_note": (
            "Оцінка на основі власного розподілу контрагентів кожної адреси-отримувача "
            "(MistTrack), застосованого пропорційно до суми, отриманої саме від "
            "досліджуваного гаманця. Це статистична оцінка ймовірного напрямку коштів, "
            "а не пряме відстеження тих самих монет по блокчейну."
        ),
        "wallet_own_distribution": wallet_entry["counterparties"] if wallet_entry else [],
        "destinations_analyzed": len(destinations),
        "total_received_by_analyzed": round(total_received, 6),
        "estimated_to_named_entities": round(known_total, 6),
        "estimated_unattributed": round(unattributed, 6),
        "entities": entities,
        "per_destination": per_destination,
    }

    OUT_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"Wrote {OUT_PATH}")
    print(f"Analyzed {len(destinations)} destinations, {total_received:,.0f} USDT received")
    print(f"Estimated to named entities: {known_total:,.0f} ({100*known_total/total_received:.1f}%)")
    print(f"Estimated unattributed: {unattributed:,.0f} ({100*unattributed/total_received:.1f}%)")


if __name__ == "__main__":
    main()
