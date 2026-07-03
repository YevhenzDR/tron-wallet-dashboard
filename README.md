# Wallet X — On-Chain Flow Analysis

Forensic-style Next.js dashboard for a single TRON wallet's USDT flows. The
wallet's identity is never shown — only pre-aggregated numbers, labeled
"Wallet X". No raw Tronscan export ever ships with the app; the repo only
contains the aggregated `data/wallet_data.json`.

## Structure

- `scripts/preprocess.py` — one-off script that reads the two Tronscan xlsx
  exports (Incoming/Outgoing transfers, not included in this repo), filters
  to `Token == "USDT"`, and writes `data/wallet_data.json`. Re-run it locally
  if the source exports change; the xlsx files themselves must never be
  committed.
- `data/wallet_data.json` — the only data file the app ships with: KPIs,
  per-counterparty totals, daily volumes, and circular-counterparty list.
- `src/lib/` — typed data loader, address/number formatting helpers, Sankey
  data-shaping logic.
- `src/components/` — KPI cards, Sankey flow diagram, mirrored daily volume
  timeline, circular-counterparties table, searchable counterparty tables.

## Regenerating the data

```bash
python3 scripts/preprocess.py
```

Reads the two xlsx files from `~/Downloads` (see the top of the script to
change the paths) and overwrites `data/wallet_data.json`.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploying to Vercel

This is a standard static-friendly Next.js App Router project — no server
secrets, no database, no API routes. The dashboard reads `data/wallet_data.json`
at build time, so the whole site can be statically prerendered.

### Option A — Vercel CLI

```bash
npm install -g vercel   # if not already installed
vercel login
vercel                  # first deploy, links the project
vercel --prod           # promote to production
```

### Option B — Git + Vercel dashboard

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In the Vercel dashboard, "Add New… → Project", import the repo.
3. Framework preset "Next.js" is auto-detected — no config overrides needed.
4. Deploy.

No environment variables are required. Before pushing, double-check that no
`.xlsx` file and nothing outside `data/wallet_data.json` containing wallet
data has been added to git (`git status`, `.gitignore` already excludes
`node_modules`, `.next`, `.vercel`).
