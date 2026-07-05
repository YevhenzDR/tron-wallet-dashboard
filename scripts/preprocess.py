#!/usr/bin/env python3
"""
Aggregate Tronscan Incoming/Outgoing xlsx exports for a single wallet into
one forensic-report JSON. Filters to Token == "USDT" only (both files
contain a handful of junk non-USDT rows that would corrupt sums).

Usage:
    python3 preprocess.py

Reads from ../../Downloads (hardcoded paths below), writes
../data/wallet_data.json.
"""
import json
import openpyxl
from collections import defaultdict
from datetime import datetime, date

WALLET = "TT3whB9h4rcvVPfxmnGNEsjvvgUHNox5iL"
WALLET_LABEL = "Wallet X"

INCOMING_PATH = "/Users/yzcentric/Downloads/Incoming_Transactions.xlsx"
OUTGOING_PATH = "/Users/yzcentric/Downloads/Outgoing_Transactions.xlsx"
OUT_PATH = "/Users/yzcentric/Desktop/tron-wallet-dashboard/data/wallet_data.json"
LEDGER_OUT_PATH = "/Users/yzcentric/Desktop/tron-wallet-dashboard/data/transactions.json"


def load_rows(path, amount_col_name):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    header = [c for c in next(ws.iter_rows(min_row=1, max_row=1, values_only=True)) if c is not None]
    idx = {name: i for i, name in enumerate(header)}
    required = ["Txn Hash", "Time(UTC)", "From", "To", "Token", amount_col_name]
    for r in required:
        if r not in idx:
            raise ValueError(f"Missing column {r!r} in {path}, found {header}")

    rows = []
    skipped_non_usdt = 0
    total_rows = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[idx["Txn Hash"]] is None:
            continue
        total_rows += 1
        token = row[idx["Token"]]
        if token != "USDT":
            skipped_non_usdt += 1
            continue
        amount = row[idx[amount_col_name]]
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            skipped_non_usdt += 1
            continue
        ts = row[idx["Time(UTC)"]]
        if isinstance(ts, datetime):
            dt = ts
        else:
            dt = datetime.fromisoformat(str(ts))
        rows.append({
            "hash": row[idx["Txn Hash"]],
            "time": dt,
            "from": row[idx["From"]],
            "to": row[idx["To"]],
            "amount": amount,
        })
    print(f"{path}: {total_rows} total rows, {len(rows)} USDT rows, {skipped_non_usdt} skipped (non-USDT/junk)")
    return rows


def main():
    incoming = load_rows(INCOMING_PATH, "Amount/TokenID")
    outgoing = load_rows(OUTGOING_PATH, "Amount")

    # Sanity: incoming rows should all have To == WALLET, outgoing From == WALLET
    bad_in = [r for r in incoming if r["to"] != WALLET]
    bad_out = [r for r in outgoing if r["from"] != WALLET]
    if bad_in:
        print(f"WARNING: {len(bad_in)} incoming rows do not have To == wallet")
    if bad_out:
        print(f"WARNING: {len(bad_out)} outgoing rows do not have From == wallet")

    total_in = sum(r["amount"] for r in incoming)
    total_out = sum(r["amount"] for r in outgoing)
    residual = total_in - total_out

    print(f"\nTotal IN:  {total_in:,.2f} USDT")
    print(f"Total OUT: {total_out:,.2f} USDT")
    print(f"Residual:  {residual:,.2f} USDT")

    # Per-counterparty aggregation
    in_by_counterparty = defaultdict(lambda: {"total": 0.0, "count": 0})
    out_by_counterparty = defaultdict(lambda: {"total": 0.0, "count": 0})

    for r in incoming:
        cp = r["from"]
        in_by_counterparty[cp]["total"] += r["amount"]
        in_by_counterparty[cp]["count"] += 1

    for r in outgoing:
        cp = r["to"]
        out_by_counterparty[cp]["total"] += r["amount"]
        out_by_counterparty[cp]["count"] += 1

    sources = sorted(
        [{"address": k, "total": v["total"], "count": v["count"]} for k, v in in_by_counterparty.items()],
        key=lambda x: -x["total"],
    )
    destinations = sorted(
        [{"address": k, "total": v["total"], "count": v["count"]} for k, v in out_by_counterparty.items()],
        key=lambda x: -x["total"],
    )

    # Circular counterparties: appear on both sides
    circular_addrs = set(in_by_counterparty.keys()) & set(out_by_counterparty.keys())
    circular = []
    for addr in circular_addrs:
        circular.append({
            "address": addr,
            "in_total": in_by_counterparty[addr]["total"],
            "in_count": in_by_counterparty[addr]["count"],
            "out_total": out_by_counterparty[addr]["total"],
            "out_count": out_by_counterparty[addr]["count"],
            "net": in_by_counterparty[addr]["total"] - out_by_counterparty[addr]["total"],
        })
    circular.sort(key=lambda x: -(x["in_total"] + x["out_total"]))

    # Daily volumes
    daily = defaultdict(lambda: {"in": 0.0, "out": 0.0, "in_count": 0, "out_count": 0})
    for r in incoming:
        d = r["time"].date().isoformat()
        daily[d]["in"] += r["amount"]
        daily[d]["in_count"] += 1
    for r in outgoing:
        d = r["time"].date().isoformat()
        daily[d]["out"] += r["amount"]
        daily[d]["out_count"] += 1

    daily_list = sorted(
        [{"date": d, **v} for d, v in daily.items()],
        key=lambda x: x["date"],
    )

    # Hour-of-day activity (UTC). A human-operated wallet shows a diurnal
    # (day/night) pattern; an exchange hot wallet runs 24/7 with no gap.
    hourly = {h: {"in": 0, "out": 0} for h in range(24)}
    for r in incoming:
        hourly[r["time"].hour]["in"] += 1
    for r in outgoing:
        hourly[r["time"].hour]["out"] += 1
    hourly_list = [
        {"hour": h, "in_count": hourly[h]["in"], "out_count": hourly[h]["out"]}
        for h in range(24)
    ]

    active_days = len(daily)
    unique_sources = len(in_by_counterparty)
    unique_destinations = len(out_by_counterparty)

    all_dates = [r["time"] for r in incoming] + [r["time"] for r in outgoing]
    first_tx = min(all_dates).isoformat() if all_dates else None
    last_tx = max(all_dates).isoformat() if all_dates else None

    kpis = {
        "wallet_label": WALLET_LABEL,
        "total_in": round(total_in, 6),
        "total_out": round(total_out, 6),
        "residual": round(residual, 6),
        "active_days": active_days,
        "unique_sources": unique_sources,
        "unique_destinations": unique_destinations,
        "incoming_tx_count": len(incoming),
        "outgoing_tx_count": len(outgoing),
        "first_tx_time": first_tx,
        "last_tx_time": last_tx,
        "circular_counterparty_count": len(circular),
    }

    output = {
        "kpis": kpis,
        "sources": sources,
        "destinations": destinations,
        "circular_counterparties": circular,
        "daily_volumes": daily_list,
        "hourly_activity": hourly_list,
    }

    # Re-apply address tags (exchange labels) if fetch_tags.py has run before,
    # so re-running this script doesn't strip the enrichment.
    tags_path = OUT_PATH.rsplit("/", 1)[0] + "/address_tags.json"
    try:
        with open(tags_path) as f:
            tag_cache = json.load(f)
    except FileNotFoundError:
        tag_cache = None
    fetch_tags = None
    if tag_cache is not None:
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "fetch_tags", __file__.rsplit("/", 1)[0] + "/fetch_tags.py"
        )
        fetch_tags = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(fetch_tags)
        fetch_tags.merge(output, tag_cache)
        print("Re-applied address tags from address_tags.json")

    with open(OUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {OUT_PATH}")
    print(f"Sources: {len(sources)}, Destinations: {len(destinations)}, Circular: {len(circular)}, Active days: {active_days}")

    # Full per-transaction ledger, for evidentiary/traceability purposes
    # (aggregates alone don't give investigators a verifiable tx hash trail).
    def tag_for(addr):
        tag = (tag_cache or {}).get(addr, "")
        is_exchange = fetch_tags.is_exchange_tag(tag) if (fetch_tags and tag) else False
        return tag, is_exchange

    ledger = []
    for r in incoming:
        counterparty = r["from"]
        tag, is_exchange = tag_for(counterparty)
        ledger.append({
            "hash": r["hash"],
            "time": r["time"].isoformat(),
            "direction": "in",
            "counterparty": counterparty,
            "amount": round(r["amount"], 6),
            "tag": tag,
            "is_exchange": is_exchange,
        })
    for r in outgoing:
        counterparty = r["to"]
        tag, is_exchange = tag_for(counterparty)
        ledger.append({
            "hash": r["hash"],
            "time": r["time"].isoformat(),
            "direction": "out",
            "counterparty": counterparty,
            "amount": round(r["amount"], 6),
            "tag": tag,
            "is_exchange": is_exchange,
        })
    ledger.sort(key=lambda x: x["time"], reverse=True)

    with open(LEDGER_OUT_PATH, "w") as f:
        json.dump({"transactions": ledger, "count": len(ledger)}, f, indent=1)

    print(f"Wrote {LEDGER_OUT_PATH} ({len(ledger)} individual transactions)")


if __name__ == "__main__":
    main()
