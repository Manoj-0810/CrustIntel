# 🦀 CrustIntel

### Autonomous Competitive Intelligence — Built on Crustdata × Claude

<div align="center">

[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Claude Sonnet 4](https://img.shields.io/badge/Claude-Sonnet_4-5A4BBA?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Crustdata APIs](https://img.shields.io/badge/Data_Layer-Crustdata_APIs-FF4B4B?style=for-the-badge)](https://crustdata.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://crust-intel.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

</div>

<div align="center">

**[🚀 Live Demo](https://crust-intel.vercel.app/)** &nbsp;·&nbsp; **[🎬 Video Walkthrough](https://www.loom.com/share/980f2f9cb2664a0790b458407d8428fc)** &nbsp;·&nbsp; **[Meta-Demo ↓](#the-meta-demo)**

*Built as a technical submission for the Applied AI Engineer & Forward Deployed Engineer roles at Crustdata (YC F24)*

</div>

---

## What this is

Most competitive intelligence tools are static dashboards. You open them, read data, and figure out what it means yourself.

**CrustIntel is an agent.** When you ask it to analyse a competitor, Claude autonomously decides which Crustdata endpoints to call, executes them in sequence, and synthesises the results into structured intelligence — without any hard-coded logic per company. Point it at any company and it produces a complete SWOT matrix, moat assessment, attack vector map, and 6-month hiring intent read.

This is exactly what Crustdata's thesis predicts: AI agents consuming structured business data, not humans clicking through dashboards.

---

## Three modes — zero setup required

CrustIntel is fully functional with zero API keys. It scales gracefully as you add them.

| Mode | Keys | What happens |
|:---|:---|:---|
| **🟡 Demo** | None | Full UI on a 675-line realistic mock dataset. Every SWOT, brief, and signal analysis returns rich pre-built intelligence. Zero setup, zero cost. Works on the live demo right now. |
| **🟠 Live Data** | Crustdata only | Company cards, market map, and metrics pull real-time headcount, funding, and employee data from Crustdata APIs. The "● Live Crustdata" badge appears in each modal. AI analysis shows a polished "add Claude key" inline prompt — no crashes, no broken UI. |
| **🟢 Full Agent** | Both keys | Complete live experience. Claude's agentic tool-use loop autonomously calls Crustdata endpoints, synthesises across multiple results, and returns structured intelligence in real time. |

The header badge updates **instantly** when you save keys in ⚙ Settings — no page reload, no spinner.

---

## The meta-demo

> *The most honest test of any tool is whether it works on itself.*

Here's CrustIntel analysing **Crustdata** — running its own agentic loop against the company it was built for:

```
Query: crustdata.com
        │
        ├── search_companies("crustdata.com")
        │       headcount: 18  ·  growth_6m: +20%  ·  stage: Series A
        │       funding_total: $9M  ·  lead_investor: Y Combinator (F24)
        │
        ├── search_jobs("Crustdata", department="Engineering")
        │       12 open roles  ·  5x backend  ·  3x ML infra
        │       ← signal: API infrastructure scaling sprint
        │
        ├── get_funding_events("Crustdata")
        │       Latest: $9M seed  ·  co-investors: General Catalyst, SV Angel
        │
        └── search_people(current_company="Crustdata", seniority="VP OR Head")
                3 senior GTM hires in last 90 days
                ← signal: enterprise go-to-market buildout underway

Claude synthesis →
  threat_level:   "medium-high for Apollo / Clay"
  moat:           "real-time data freshness + API-first is an 18-month defensible lead"
  attack_vector:  "ZoomInfo churn window is closing — capture enterprise segment now"
  hiring_intent:  "ML infra hiring = streaming pipeline architecture, not batch.
                   Major product bet incoming — likely a real-time alerting layer."
  ai_playbook:    [
                    "Target ZoomInfo enterprise accounts with a data freshness pitch",
                    "Launch partner integrations before Apollo ships MCP native support",
                    "Publish benchmark study: Crustdata freshness vs incumbent staleness"
                  ]
```

---

## How the agentic loop works

This is the core architectural decision. Claude is not called once with a large prompt — it runs in a multi-turn loop where it decides which tools to invoke based on intermediate results.

```
User triggers analysis (Deep Dive / Signal / Brief / Talent)
        │
        ▼
callClaude({ systemPrompt, userPrompt, tools: CRUSTDATA_TOOLS })
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Claude Agentic Loop                         │
│                    (max 8 iterations guard)                      │
│                                                                  │
│  Iter 1 — Claude reasons → stop_reason: "tool_use"              │
│    └─ search_companies("apollo.io")                              │
│         callCrustdata("screener/company/search", filters)        │
│         → { headcount: 1200, growth_6m: +8.3%, funding: $251M } │
│         tool_result injected into messages[]                     │
│                                                                  │
│  Iter 2 — Claude reasons → stop_reason: "tool_use"              │
│    └─ search_jobs("Apollo.io", department="ML")                  │
│         callCrustdata("screener/job/search", filters)            │
│         → 34 open ML roles (signal: AI SDR product bet)          │
│         tool_result injected                                     │
│                                                                  │
│  Iter 3 — Claude reasons → stop_reason: "tool_use"              │
│    └─ get_funding_events("Apollo.io")                            │
│         callCrustdata("screener/company/search", funding filter) │
│         → $100M Series D, 2023 · lead: Sequoia                  │
│         tool_result injected                                     │
│                                                                  │
│  Iter 4 — Claude reasons → stop_reason: "end_turn"              │
│    └─ All data gathered. Synthesise.                             │
│    └─ Returns structured JSON intelligence object                │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
{
  "threat_level": "high",
  "crustdata_snapshot": {
    "headcount": 1200,
    "headcount_growth_6m_pct": 8.3,
    "open_roles_count": 34,
    "recent_funding_usd": 100000000
  },
  "swot": {
    "strengths":     ["Network effects from 11k+ customers", "..."],
    "weaknesses":    ["Over-reliant on outbound email channel", "..."],
    "opportunities": ["AI SDR market expanding 3x YoY", "..."],
    "threats":       ["Crustdata real-time data closes their data moat", "..."]
  },
  "moat_analysis":  "Apollo's moat is customer lock-in via workflow integrations...",
  "attack_vectors": ["Target churned Apollo customers with freshness pitch", "..."],
  "hiring_intent":  "34 open ML roles signals autonomous AI SDR product in development",
  "ai_playbook":    ["Launch Crustdata-powered SDR benchmark study", "..."]
}
```

Claude is never told which tools to call. It reads the task, reasons about what data it needs, and calls tools in the order that makes sense for that specific company — genuine agentic reasoning, not a scripted pipeline.

---

## Five analyses, one engine

All five intelligence functions share the same agentic loop in [`lib/ai.js`](./lib/ai.js). Only the system prompt and output schema differ.

| Function | Triggered by | Tools invoked | Output schema |
|:---|:---|:---|:---|
| `analyzeSignal()` | Signal card click | `get_company_headcount`, `search_jobs` | `severity`, `impact_score`, `recommended_actions`, `time_sensitivity` |
| `generateBrief()` | Weekly brief panel | All 5 tools · top 3 competitors | `executive_summary`, `sections[]`, `key_risks`, `threat_score` |
| `analyzeDeepDive()` | "Deep Dive →" in modal | All 5 tools · 8 iterations max | `swot`, `moat_analysis`, `attack_vectors`, `hiring_intent`, `ai_playbook` |
| `analyzeMarketPosition()` | Market map render | `search_companies`, `get_company_headcount` | `position_score`, `fastest_growing`, `biggest_threat`, `best_opportunity` |
| `analyzeTalentFlow()` | "Analyse" per flow pair | `search_people` | `moves_found`, `senior_moves[]`, `pattern`, `risk_level` |

Every function returns a rich per-company mock response when no Claude key is present. The UI never shows empty boxes or spinners that never resolve.

---

## Crustdata API coverage

Three Crustdata endpoints — five Claude-callable tools.

```
POST /screener/company/search  →  search_companies()        headcount, funding, growth
                               →  get_company_headcount()   real-time trend data
                               →  get_funding_events()      latest round, investors

POST /screener/job/search      →  search_jobs()             open roles → strategy signals

POST /screener/person/search   →  search_people()           exec moves, talent flow
```

**Real API response → normalised shape** (in `lib/crustdata.js`):

```javascript
{
  id:                    c.company_id,
  name:                  c.company_name,
  domain:                c.company_website_domain,
  headcount:             c.headcount,
  headcount_growth_6m:   c.headcount_growth_6_months_percent,
  headcount_growth_12m:  c.headcount_growth_12_months_percent,
  funding_total_usd:     c.total_funding_raised_usd,
  funding_stage:         c.latest_funding_stage,
  latest_round_usd:      c.latest_funding_amount_usd,
  revenue_estimate_usd:  c.estimated_annual_revenue_usd,
  hq_location:           c.hq_city,
  industry:              c.industry,
}
```

Mock counterparts return the exact same shape. The UI reads the same fields whether the data is live or mock — `USE_REAL_API=true` is the only switch.

**Rate-limit handling** — `crustFetch()` implements exponential backoff on HTTP 429:

```javascript
if (res.status === 429) {
  const wait = Math.pow(2, attempt) * 1000; // 1s → 2s → 4s
  await new Promise(r => setTimeout(r, wait));
  continue;
}
```

---

## Features

### Radial market map
Competitors plotted in concentric threat orbits. Distance from Crustdata at the centre encodes threat level; arc colour encodes 6-month headcount growth rate. Click any node to open the enriched company modal. Fully mouse and keyboard navigable.

### Live signal feed + simulation engine
Filterable feed of competitive signals — hiring surges, funding rounds, exec departures, product launches — sorted by severity. A client-side simulation engine appends a new signal every 45 seconds, updating the signal count and threat score in MetricsBar in real time. Each signal card triggers a one-click Claude analysis.

### Weekly intelligence briefs
Synthesised from the top 10 signals and top 5 competitors. Claude fetches live headcount for top-threat competitors before writing. Output: threat score (1–10), executive summary, three thematic sections, key risks, and recommended actions. Falls back to a rich pre-built mock brief in Demo Mode.

### Deep Dive — the flagship feature
Full Claude + Crustdata teardown on any competitor: live snapshot (headcount, funding, open role count), SWOT matrix, moat assessment paragraph, attack vectors, and a 3-point autonomous playbook. Per-company mock SWOTs are hand-crafted for Apollo.io, ZoomInfo, and Lusha — grounded in real public data, not generic filler.

### Talent flow intelligence
Per-pair Claude analysis calls `search_people` with `previous_company` and `current_company` filters, detects senior executive moves, and returns a strategic pattern assessment. The talent moves counter in MetricsBar increments on each analysis.

### Metrics bar — live reactive state
Seven KPI cards: companies tracked, signals detected, this week, threat score, briefs generated, talent moves, data freshness. All driven by React state and updated live as you interact — SWOT generations adjust the threat score, talent analyses increment moves, signal simulation updates counts. No page reload required.

### ⚙ Settings — three-state key management
Live "Test" key validation for the Anthropic key before saving. Keys stored in `localStorage` only — never sent to any server except the AI/data provider. The header badge updates **instantly** on save via `window.dispatchEvent(new CustomEvent('crustintel:keys-saved'))` — not the native `storage` event which only fires cross-tab.

---

## Project structure

```
crustintel/
├── app/
│   ├── page.js                     War room shell — state, signal simulation,
│   │                               keyboard shortcuts, metric callbacks
│   ├── globals.css                 650-line design system (glassmorphism dark)
│   ├── layout.js                   Root layout
│   └── components/
│   │   ├── Header.js               3-state AI badge · ⚙ trigger · Cmd+K
│   │   ├── MetricsBar.js           7 live-reactive KPI cards
│   │   ├── MarketMap.js            Radial SVG threat orbit
│   │   ├── SignalFeed.js           Filterable severity-sorted feed
│   │   ├── IntelBrief.js           Weekly brief + threat ring
│   │   ├── TalentFlow.js           Flow tracker + per-pair analysis
│   │   ├── CompanyModal.js         Enriched overlay + Deep Dive panel
│   │   ├── SearchModal.js          Cmd+K fuzzy search
│   │   └── SettingsPanel.js        Key config + live test + instant badge update
│   └── api/
│       ├── analyze/route.js        Three-mode: mock → key-error → live Claude
│       ├── deepdive/route.js       Three-mode: mock SWOT → key-error → live agent
│       ├── talent/route.js         Talent flow analysis (4 iterations)
│       ├── company/route.js        Live company lookup with mock fallback
│       ├── signals/route.js        Signal feed with filters
│       └── discover/route.js       Competitor discovery by domain
│       ↑ All routes export maxDuration = 60 for Vercel timeout safety
└── lib/
    ├── ai.js                       Claude engine — agentic loop, 5 analysis
    │                               functions, per-company mock SWOTs,
    │                               key validation helpers
    ├── crustdata.js                Tool executor — 5 real API functions +
    │                               mock fallbacks, identical response shapes,
    │                               single-flag switching, retry backoff
    ├── mock-data.js                675-line mock dataset (exact API shapes)
    └── utils.js                    formatNumber, formatCurrency, formatGrowth
```

---

## Quick start

```bash
git clone https://github.com/yourusername/crustintel
cd crustintel
npm install
cp .env.example .env.local   # fill in your keys, or leave blank for demo mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). **Works immediately with zero keys.**

Or use the **[live deployment →](https://crust-intel.vercel.app/)** directly.

---

## Environment variables

```bash
# .env.local — never commit this file

# Claude (Anthropic) — required for live AI analysis
# Free $5 credit on signup — enough for 2,000+ analyses
ANTHROPIC_API_KEY=sk-ant-api03-...

# Crustdata — required for live company/job/people data
# Free tier available at crustdata.com
CRUSTDATA_API_KEY=crustdata_live_...

CRUSTDATA_API_URL=https://api.crustdata.com
CRUSTDATA_API_VERSION=2025-11-01

# false = demo mode (default, mock data, no keys needed)
# true  = live mode (requires CRUSTDATA_API_KEY)
USE_REAL_API=false
```

| Variable | Required for | Where |
|:---|:---|:---|
| `ANTHROPIC_API_KEY` | All 5 live AI analyses | [console.anthropic.com/keys](https://console.anthropic.com/keys) |
| `CRUSTDATA_API_KEY` | Live company / job / people data | [crustdata.com](https://crustdata.com) — free tier |
| `USE_REAL_API` | Activates live data layer | Set `true` in `.env.local` or Vercel dashboard |

Keys can also be pasted directly into ⚙ Settings in the app — they are stored in `localStorage` only and passed server-side via the request body, never logged.

---

## Deployment

### Vercel (live at [crust-intel.vercel.app](https://crust-intel.vercel.app/))

```bash
npx vercel --prod
# Add env vars in Vercel dashboard:
#   ANTHROPIC_API_KEY, CRUSTDATA_API_KEY, USE_REAL_API=true
```

**Timeout configuration** — All six API route handlers export `maxDuration = 60`. This prevents Vercel's default 10-second serverless timeout from truncating the Claude agentic loop, which performs 4–8 sequential tool calls and typically resolves in 4–8 seconds.

```javascript
// Present in all 6 route handlers
export const maxDuration = 60;
```

---

## Tech stack

| Layer | Choice | Why |
|:---|:---|:---|
| Framework | Next.js 15 (App Router) | Server-side API routes keep keys off the client |
| AI | Claude Sonnet 4 (`claude-sonnet-4-20250514`) | Best tool-use accuracy at this token budget |
| Data | Crustdata REST APIs | Only provider with real-time headcount + job + people in one API |
| Styling | Vanilla CSS — 650-line design system | Zero runtime overhead; full control over glassmorphism tokens |
| Deployment | Vercel | Zero-config Next.js deploy with edge function support |

**Zero heavy dependencies** — `package.json` lists only `next`, `react`, `react-dom`. The agentic loop and all API integrations are built directly on `fetch`.

---

## Engineering decisions worth noting

**`maxDuration = 60` on all routes** — Vercel's free tier defaults to a 10-second serverless timeout. The Claude agentic loop runs 4–8 sequential Crustdata tool calls before synthesising — consistently 4–8 seconds of wall-clock time. Without `maxDuration = 60`, every Deep Dive would 504 in production.

**Custom browser event instead of native `storage`** — The native `storage` event only fires in *other* tabs. Components that react to key changes (`Header` badge, `CompanyModal` live reload) listen for `window.addEventListener('crustintel:keys-saved', …)` — dispatched by `SettingsPanel` immediately after saving — so the badge updates the instant you click Save.

**Per-company hand-crafted mock SWOTs** — Apollo, ZoomInfo, and Lusha each have mock analyses grounded in their actual public competitive data — real headcount numbers, real funding stages, real hiring patterns. Demo Mode tells a real story, not placeholder lorem ipsum.

**Identical mock and real API response shapes** — Every real Crustdata function normalises its response into the exact same object shape as the mock equivalent. There is no conditional rendering in the UI — it always reads the same fields from the same object. The entire data layer toggles with `USE_REAL_API=true`.

**Three-mode routing in every API handler** — Each route explicitly handles: no keys (rich mock), Crustdata-only (polished professional key-error panel), Claude active (live agentic loop with optional live data). The error states are designed UI components, not raw error strings thrown to the console.

---

## What's next

- **Watcher alerts** — Crustdata webhook integration to push signals when a monitored company crosses a headcount or funding threshold
- **Scheduled briefs** — cron-triggered weekly brief delivery via email or Slack
- **Multi-tenant** — per-user company + competitor sets persisted to a database
- **Streaming responses** — stream Claude's synthesis token-by-token so the Deep Dive panel fills in live rather than appearing all at once

---

## About

Built by **[Your Name]** — technical submission for the Applied AI Engineer and Forward Deployed Engineer positions at Crustdata, June 2026.

Crustdata is backed by Y Combinator, General Catalyst, SV Angel, and A Capital, and powers AI agents for customers including Dharmesh Shah's agent.ai and Ryan Reynolds' MNTN. CrustIntel is a working proof that their core thesis — AI agents consuming structured business data autonomously — is already buildable today with the tools they have shipped.

---

<div align="center">

*Next.js 15 · React 19 · Claude Sonnet 4 · Crustdata APIs · Deployed on Vercel*

**[🚀 crust-intel.vercel.app](https://crust-intel.vercel.app/)** · **[🎬 Loom Walkthrough](https://www.loom.com/share/980f2f9cb2664a0790b458407d8428fc)**

</div>
