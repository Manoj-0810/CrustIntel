# 🦀 CrustIntel

### Autonomous Competitive Intelligence War Room — Built on Crustdata × Claude 3.5 Sonnet

<div align="center">

[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Claude 3.5 Sonnet](https://img.shields.io/badge/Claude_3.5_Sonnet-5A4BBA?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Crustdata APIs](https://img.shields.io/badge/Data_Layer-Crustdata-FF4B4B?style=for-the-badge)](https://crustdata.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

</div>

---

> **Technical Submission for the Applied AI Engineer Role at Crustdata.**  
> CrustIntel is an enterprise-grade competitive intelligence system demonstrating **Claude 3.5 Sonnet** and the **Crustdata REST APIs** working in an autonomous reasoning loop. It transforms raw market data into real-time strategic playbooks.

**[Live Production Site →](https://crustintel.vercel.app)** &nbsp;·&nbsp; **[5-min Loom Walkthrough →](https://www.loom.com/share/980f2f9cb2664a0790b458407d8428fc)** &nbsp;·&nbsp; **[Metademo Analysis ↓](#-the-meta-demo-analysing-crustdata)**

---

## 📋 Table of Contents
1. [✦ What this is](#-what-this-is)
2. [✦ The Meta-Demo: Analysing Crustdata](#-the-meta-demo-analysing-crustdata)
3. [✦ System Architecture & Data Flow](#-system-architecture--data-flow)
4. [✦ Key Features Teardown](#-key-features-teardown)
5. [✦ Core Engineering Decisions](#-core-engineering-decisions)
6. [✦ Crustdata API Specifications](#-crustdata-api-specifications)
7. [✦ Directory Structure](#-directory-structure)
8. [✦ Environment Configurations](#-environment-configurations)
9. [✦ Quick Start & Local Setup](#-quick-start--local-setup)
10. [✦ Production Deployment](#-production-deployment)

---

## ✦ What this is

Most competitive intelligence platforms are passive dashboard collections—they query databases, compile charts, and leave the analysis entirely to the human operator.

**CrustIntel is an active AI agent.** When requested to analyze a competitor, the agent:
1. **Reads the high-level request** and reasons about the target company.
2. **Determines which Crustdata REST endpoints to call** based on the analytical goal.
3. **Executes multiple API queries in sequence** (headcount, job listings, executive movements, funding events).
4. **Synthesizes raw inputs** into a structured, highly actionable competitive assessment.

This reflects the fundamental thesis of modern business data consumption: **AI agents consuming structured API endpoints autonomously, rather than humans navigating complex graphical user interfaces.**

---

## ✦ The Meta-Demo: Analysing Crustdata

> *The ultimate validator of any intelligence engine is its ability to perform self-analysis.*

Below is the execution log of CrustIntel analyzing **Crustdata itself** by executing live REST requests:

```
Query: "Analyze crustdata.com"
        │
        ├── search_companies("crustdata.com")
        │       headcount: 18  ·  growth_6m: +20%  ·  stage: Series A
        │
        ├── search_jobs("Crustdata", department="Engineering")
        │       12 open roles  ·  5x backend  ·  3x ML infra  ←  Signal: Scaling API infrastructure
        │
        ├── get_funding_events("Crustdata")
        │       Latest: $9M  ·  Lead: Y Combinator (F24)
        │
        └── search_people(current_company="Crustdata", title="VP OR Head")
                3 senior GTM hires in last 90 days  ←  Signal: Accelerating enterprise sales
 
Claude Synthesis →
  threat_level: "medium-high for legacy market research firms"
  moat: "Real-time API-first delivery is an 18-month defensible product lead"
  attack_vector: "Capitalize on ZoomInfo price/freshness gaps to win high-volume developers"
  hiring_intent: "ML infra recruitment signals transition to streaming data pipeline structures"
```

---

## ✦ System Architecture & Data Flow

CrustIntel implements a stateless client-side credential model combined with Next.js Serverless Route handlers. API keys are sent securely in individual POST headers, never written to a centralized database.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Interface
    participant API as Next.js API Routes (Serverless)
    participant Agent as Claude Agentic Loop (lib/ai.js)
    participant Client as Crustdata API Client (lib/crustdata.js)
    participant Ext as Crustdata REST Gateways

    User->>API: Send Request (Target Company + API Keys in headers)
    API->>Agent: Instantiate reasoning loop with API keys
    Note over Agent: Claude reasons: "I need company stats first..."
    Agent->>Client: callCrustdata("search_companies", { query: "apollo.io" })
    Client->>Ext: POST /company/enrich
    Ext-->>Client: Returns company profile (headcount, stage, revenue)
    Client-->>Agent: Injects normalized JSON back to Claude context
    Note over Agent: Claude reasons: "Headcount is growing; let me check hiring..."
    Agent->>Client: callCrustdata("search_jobs", { company: "Apollo" })
    Client->>Ext: POST /job/search
    Ext-->>Client: Returns job listings
    Client-->>Agent: Injects normalized jobs list
    Note over Agent: Claude reasons: "Synthesizing SWOT matrix..."
    Agent-->>API: Returns final structured JSON payload
    API-->>User: Renders dashboard details (SWOT, Playbook, Moat)
```

---

## ✦ Key Features Teardown

### 1. Radial Market Orbit Map
* **Visual Competitive Pulse:** Competitors are mapped in interactive SVG orbits relative to the primary subject. The distance from the center denotes relative threat level, and orbit node colors denote 6-month headcount growth metrics.
* **Interactive Node Drills:** Fully zoomable and pannable map. Clicking any competitor node automatically slides open the details drawer and fetches enriched live data.

### 2. Live Signal Triage Feed
* **Chronological Signal Stream:** Gathers executive hires, hiring surges, funding events, and press announcements.
* **One-Click AI Analysis:** Tapping any signal card triggers an agentic query to [lib/ai.js](file:///c:/Users/Admin/OneDrive/Desktop/CrustIntel/lib/ai.js) to investigate the source company and return strategic impact scores, timeline sensitivity, and recommended actions.

### 3. Competitor Deep Dives & Autonomous Playbooks
* **SWOT Generator:** Generates a real-time SWOT analysis based on live Crustdata metrics.
* **Defensive Action Playbooks:** Synthesizes threat indexes to build a 3-point defensive execution checklist tailored to your engineering and sales teams.

### 4. Talent Flow Mapping
* **Migration Vector Tracks:** Visualizes green/red directional flows indicating competitors losing talent to or acquiring talent from one another.
* **Flow Diagnostics:** Tapping "Analyze" queries live previous/current employer lists, highlighting high-profile executive transitions.

### 5. Keyboard Commands (Cmd+K)
* **API Command Console:** Instant search indexing. Searching for a company not present in the local database displays a "Search Live Crustdata" trigger, allowing real-time discovery and dynamic profile generation.

---

## ✦ Core Engineering Decisions

### 1. Custom Same-Tab Settings Sync
To prevent settings mismatches, saving API keys in [SettingsPanel.js](file:///c:/Users/Admin/OneDrive/Desktop/CrustIntel/app/components/SettingsPanel.js) triggers a custom global event:
```javascript
window.dispatchEvent(new CustomEvent('crustintel:keys-saved'));
```
Listeners in [Header.js](file:///c:/Users/Admin/OneDrive/Desktop/CrustIntel/app/components/Header.js) and [CompanyModal.js](file:///c:/Users/Admin/OneDrive/Desktop/CrustIntel/app/components/CompanyModal.js) catch this event, immediately updating the status badge to "Crustdata Active" and refreshing active details drawers in the same tab.

### 2. Static Webpack Dev Bundling
Dynamic code splitting using dynamic `await import()` in Next.js Serverless routes was causing `Cannot find module './873.js'` errors during hot reloads.
* **Solution:** Standardized on top-level static imports in `lib/ai.js` and Route Handlers, ensuring bulletproof Next.js production builds and zero bundle configuration discrepancies.

### 3. Graceful UI Overlay Close Guards
Modals were closing accidentally due to dragging events starting inside the modal but releasing outside. Enforced absolute event target matching:
```javascript
const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
};
```
This protects modal states and forms from accidental closures.

### 4. Resilient Fallbacks & Quota Warnings
If API keys are missing, CrustIntel runs completely on a 675-line offline JSON dataset matching the live API output structures. When keys are live, errors (e.g. `402 Payment Required` due to credit exhaustion) are intercepted by [lib/crustdata.js](file:///c:/Users/Admin/OneDrive/Desktop/CrustIntel/lib/crustdata.js) and mapped to descriptive alert banners:
```javascript
if (res.status === 402) {
  return { error: true, code: 402, message: "Crustdata API Quota/Credits Exceeded." };
}
```

---

## ✦ Crustdata API Specifications

To resolve live payload schema errors (`400 Bad Request` and `500 Internal Error`), our API Client in [lib/crustdata.js](file:///c:/Users/Admin/OneDrive/Desktop/CrustIntel/lib/crustdata.js) has been optimized for the latest endpoints:

| Action | Endpoint Called | Headers Required | Payload Strategy |
| :--- | :--- | :--- | :--- |
| **Search/Enrich** | `/company/enrich` | `X-Crustdata-Version: 2.1.0`<br>`x-api-version: v2.1` | Checks if query resembles a domain (uses `domains`) or text (uses `names`). |
| **Search Jobs** | `/job/search` | `X-Crustdata-Version: 2.1.0`<br>`x-api-version: v2.1` | Queries using `{ field: "company.basic_info.name", type: "=", value: company_name }`. |
| **Search People** | `/screener/person/search` | `X-Crustdata-Version: 2.1.0`<br>`x-api-version: v2.1` | Sends array filters using `type: "in"` and uses the `PAST_COMPANY` column filter. |

### Robust Employee Headcount Parsing
When API responses return null/empty values for specific headcount fields, CrustIntel parses the `employee_count_range` string to keep visualizations functional:
```javascript
function parseHeadcountRange(rangeStr) {
  if (!rangeStr) return 50; // Default estimate
  const parts = rangeStr.replace(/[^0-9-]/g, '').split('-');
  if (parts.length === 2) {
    return Math.floor((parseInt(parts[0]) + parseInt(parts[1])) / 2);
  }
  return parseInt(parts[0]) || 50;
}
```

---

## ✦ Directory Structure

The repository is modular and structured as follows:

```
crustintel/
├── app/
│   ├── page.js                     # Main Dashboard Layout, shortcuts, onboarding logic
│   ├── globals.css                 # Custom HSL design tokens, glassmorphism UI variables
│   ├── layout.js                   # Root HTML template & metadata wrappers
│   ├── components/
│   │   ├── CompanyModal.js         # Slide-out company intelligence & SWOT playbooks
│   │   ├── Header.js               # Status badges, navigation, settings button
│   │   ├── IntelBrief.js           # Weekly/Monthly Executive summaries & threat gauge
│   │   ├── MarketMap.js            # SVG Interactive Orbital market diagram
│   │   ├── MetricsBar.js           # Numerical statistics panels
│   │   ├── SearchModal.js          # Cmd+K search dialog (local database + live lookup)
│   │   ├── SettingsPanel.js        # API Key config window (persisted to localStorage)
│   │   ├── SignalFeed.js           # Severity-sorted threat alert streams
│   │   └── TalentFlow.js           # Competitor-to-competitor migration grids
│   └── api/
│       ├── analyze/route.js        # Route: Triage signals, metrics, and briefs
│       ├── deepdive/route.js       # Route: SWOT generators & autonomous playbooks
│       └── talent/route.js         # Route: Historical people transition lookups
├── lib/
│   ├── ai.js                       # Anthropic Client & Agentic reasoning loop
│   ├── crustdata.js                # Crustdata REST Client & payload normalizers
│   ├── mock-data.js                # Offline high-fidelity mock dataset
│   └── utils.js                    # Numerical and string styling helpers
├── .env.example                    # Sample environment variables file
├── package.json                    # Project dependencies
└── README.md                       # High-level developer documentation
```

---

## ✦ Environment Configurations

Duplicate the sample configurations file to initialize environment settings:
```bash
cp .env.example .env.local
```

### Configuration Variables Spec:
```bash
# .env.local

# Anthropic Claude Key — Required for all AI analyses
ANTHROPIC_API_KEY=sk-ant-api03-...

# Crustdata API Key — Required for live data enrichment
CRUSTDATA_API_KEY=crustdata_live_...

# Toggle Mode: true = live REST connections, false = sandbox mock data
USE_REAL_API=false
```

---

## ✦ Quick Start & Local Setup

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** or **yarn**

### 1. Install Dependencies
Clone the repository and install packages:
```bash
git clone https://github.com/your-username/crustintel.git
cd crustintel
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Anthropic and Crustdata keys.

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the war room dashboard in your browser.

---

## ✦ Production Deployment

Deploy the application to Vercel in a single command:

```bash
npx vercel --prod
```

### Production Environment Variables Checklist:
Ensure the following keys are added to the Vercel project settings:
1. `ANTHROPIC_API_KEY` (Your Anthropic API key)
2. `CRUSTDATA_API_KEY` (Your Crustdata API key)
3. `USE_REAL_API` = `true` (Enables live REST fetching out of the box)

---

*Developed by Manoj RS as a technical submission for the Applied AI Engineer role at Crustdata.*