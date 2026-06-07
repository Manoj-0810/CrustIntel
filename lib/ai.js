// ============================================================
// lib/ai.js — Claude AI Engine (Claude-only, tool-use enabled)
// CrustIntel uses Claude exclusively, as specified in the
// Crustdata Applied AI Engineer job posting.
// ============================================================

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

import { callCrustdata } from './crustdata.js';
import { INTEL_BRIEFS } from './mock-data.js';

// Key validation helpers
export function hasValidClaudeKey(key) {
  if (!key) return false;
  const k = key.trim();
  if (!k || k === 'your_anthropic_api_key_here' || k === 'sk-ant-api03-...' || k.length < 10) return false;
  return true;
}

export function hasValidCrustKey(key) {
  if (!key) return false;
  const k = key.trim();
  if (!k || k === 'your_crustdata_api_key_here' || k === 'crustdata_live_...' || k.length < 10) return false;
  return true;
}

// ── Tool definitions for Claude's agentic loop ──────────────

export const CRUSTDATA_TOOLS = [
  {
    name: 'search_companies',
    description:
      'Search Crustdata for companies by name, domain, or keyword. Returns headcount, funding, revenue estimates, and growth metrics.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Company name, domain, or industry keyword' },
        limit: { type: 'number', description: 'Max results to return (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_company_headcount',
    description:
      'Fetch real-time headcount and growth trend for a specific company from Crustdata.',
    input_schema: {
      type: 'object',
      properties: {
        company_name: { type: 'string', description: 'Company name' },
        domain: { type: 'string', description: 'Company domain (e.g. apollo.io)' },
      },
      required: ['company_name'],
    },
  },
  {
    name: 'search_jobs',
    description:
      'Search Crustdata for recent job postings from a company. Useful for detecting hiring surges and strategic pivots.',
    input_schema: {
      type: 'object',
      properties: {
        company_name: { type: 'string', description: 'Company to search job posts for' },
        department: { type: 'string', description: 'Filter by department (e.g. Engineering, Sales, ML)' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: ['company_name'],
    },
  },
  {
    name: 'search_people',
    description:
      'Search for people on Crustdata by employer, title, or recent job change. Use to track executive moves and talent flows.',
    input_schema: {
      type: 'object',
      properties: {
        current_company: { type: 'string', description: 'Current employer name' },
        previous_company: { type: 'string', description: 'Previous employer (to track inflows from a competitor)' },
        title_keywords: { type: 'string', description: 'Job title keywords (e.g. VP, CTO, ML Engineer)' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'get_funding_events',
    description:
      'Get recent funding rounds and investor data for a company from Crustdata.',
    input_schema: {
      type: 'object',
      properties: {
        company_name: { type: 'string', description: 'Company name' },
      },
      required: ['company_name'],
    },
  },
];

// ── Internal: call Crustdata tool from Claude's tool_use ────

async function executeCrustdataTool(toolName, toolInput, crustKey = null) {
  return await callCrustdata(toolName, toolInput, crustKey);
}

// ── Core Claude call with agentic tool-use loop ─────────────

async function callClaude({ systemPrompt, userPrompt, tools = [], apiKey = null, crustKey = null, maxIterations = 5 }) {
  const key = apiKey || (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : null);
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set. Add it to your .env.local file.');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': ANTHROPIC_VERSION,
  };

  if (typeof window !== 'undefined') {
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  let messages = [{ role: 'user', content: userPrompt }];
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    const body = {
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
      ...(tools.length > 0 ? { tools } : {}),
    };

    const res = await fetch(ANTHROPIC_API, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Claude API error ${res.status}`);
    }

    const data = await res.json();

    if (data.stop_reason === 'end_turn' || !data.content.some((b) => b.type === 'tool_use')) {
      const textBlocks = data.content.filter((b) => b.type === 'text');
      return textBlocks.map((b) => b.text).join('\n');
    }

    const assistantMessage = { role: 'assistant', content: data.content };
    messages.push(assistantMessage);

    const toolResults = [];
    for (const block of data.content) {
      if (block.type !== 'tool_use') continue;

      let result;
      try {
        result = await executeCrustdataTool(block.name, block.input, crustKey);
      } catch (e) {
        result = { error: e.message };
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: 'user', content: toolResults });
  }

  throw new Error('Claude agentic loop exceeded max iterations');
}

// ── Signal Analysis ─────────────────────────────────────────

export async function analyzeSignal(signal, company, apiKey = null, crustKey = null) {
  const activeClaude = apiKey || (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : null);
  const activeCrust = crustKey || (typeof process !== 'undefined' ? process.env.CRUSTDATA_API_KEY : null);

  const validClaude = hasValidClaudeKey(activeClaude);
  const validCrust = hasValidCrustKey(activeCrust);

  if (validCrust && !validClaude) {
    throw new Error('Anthropic Claude API key is not added. Please click the settings icon (⚙) at the top right and configure a valid Claude API key.');
  }

  if (!validClaude) {
    return getMockSignalAnalysis(signal);
  }

  const systemPrompt = `You are a senior competitive intelligence analyst at ${company.name}. 
You have access to Crustdata's real-time company data APIs and use them to verify and enrich your analysis.
Always fetch live data before forming conclusions. Return ONLY valid JSON — no markdown, no preamble.`;

  const userPrompt = `Analyze this competitive signal and return enriched intelligence.

Signal: ${JSON.stringify(signal)}
Our company: ${JSON.stringify({ name: company.name, domain: company.domain, headcount: company.headcount })}

Use your tools to fetch current data about ${signal.company_name} (headcount, recent jobs, funding).
Then return this exact JSON structure:
{
  "severity": "critical|high|medium|low",
  "impact_score": <1-10>,
  "summary": "<2-sentence analyst summary with specific numbers from Crustdata>",
  "recommended_actions": ["<action 1>", "<action 2>", "<action 3>"],
  "time_sensitivity": "urgent|this_week|this_month|monitor",
  "crustdata_insights": "<what the live Crustdata data revealed>",
  "competitive_angle": "<specific threat or opportunity for ${company.name}>"
}`;

  const raw = await callClaude({
    systemPrompt,
    userPrompt,
    tools: CRUSTDATA_TOOLS,
    apiKey: activeClaude,
    crustKey: activeCrust,
  });

  return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
}

// ── Intelligence Brief Generation ──────────────────────────

export async function generateBrief(signals, company, competitors, apiKey = null, crustKey = null) {
  const activeClaude = apiKey || (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : null);
  const activeCrust = crustKey || (typeof process !== 'undefined' ? process.env.CRUSTDATA_API_KEY : null);

  const validClaude = hasValidClaudeKey(activeClaude);
  const validCrust = hasValidCrustKey(activeCrust);

  if (validCrust && !validClaude) {
    throw new Error('Anthropic Claude API key is not added. Please click the settings icon (⚙) at the top right and configure a valid Claude API key.');
  }

  if (!validClaude) {
    return getMockBrief();
  }

  const systemPrompt = `You are the Head of Competitive Intelligence at ${company.name}.
You synthesize market signals and Crustdata's live company data into executive-grade intelligence briefs.
Use your tools to pull current headcount and funding data for the top competitors.
Return ONLY valid JSON.`;

  const userPrompt = `Generate this week's competitive intelligence brief.

Our company: ${JSON.stringify({ name: company.name, headcount: company.headcount, domain: company.domain })}
Competitors: ${JSON.stringify(competitors.map((c) => ({ name: c.name, domain: c.domain, threat_level: c.threat_level })))}
Recent signals (top 10): ${JSON.stringify(signals.slice(0, 10))}

First, use your tools to fetch live headcount for the top 3 competitors by threat level.
Then return this exact JSON:
{
  "title": "Weekly Intel Brief",
  "subtitle": "<date range, e.g. Week of June 2–8, 2026>",
  "threat_score": <1-10 overall competitive pressure>,
  "executive_summary": "<3-4 sentences synthesizing the week's key competitive moves with specific Crustdata numbers>",
  "sections": [
    { "heading": "🚨 Critical Movements", "content": "<specific findings with numbers>" },
    { "heading": "📈 Talent Signals", "content": "<hiring trends observed>" },
    { "heading": "💡 Strategic Outlook", "content": "<what this means for ${company.name}>" }
  ],
  "key_risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "recommended_actions": ["<action 1>", "<action 2>", "<action 3>"]
}`;

  const raw = await callClaude({
    systemPrompt,
    userPrompt,
    tools: CRUSTDATA_TOOLS,
    apiKey: activeClaude,
    crustKey: activeCrust,
    maxIterations: 8,
  });

  return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
}

// ── Deep Dive (Competitor Strategic Analysis) ───────────────

export async function analyzeDeepDive(company, competitors, apiKey = null, crustKey = null) {
  const activeClaude = apiKey || (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : null);
  const activeCrust = crustKey || (typeof process !== 'undefined' ? process.env.CRUSTDATA_API_KEY : null);

  const validClaude = hasValidClaudeKey(activeClaude);
  const validCrust = hasValidCrustKey(activeCrust);

  if (validCrust && !validClaude) {
    throw new Error('Anthropic Claude API key is not added. Please click the settings icon (⚙) at the top right and configure a valid Claude API key.');
  }

  if (!validClaude) {
    return getMockSWOT(company);
  }

  const systemPrompt = `You are a strategic intelligence analyst. Use Crustdata tools to gather live data
before forming your assessment. Return ONLY valid JSON.`;

  const userPrompt = `Generate a strategic deep dive on ${company.name} (${company.domain}).

Use tools to fetch: (1) current headcount & growth, (2) recent job postings to infer strategy, 
(3) recent funding events, (4) key executive hires.

Return this exact JSON:
{
  "threat_level": "critical|high|medium|low",
  "crustdata_snapshot": {
    "headcount": <number from live data>,
    "headcount_growth_pct": <number>,
    "recent_funding_usd": <number or null>,
    "open_roles_count": <number>
  },
  "swot": {
    "strengths": ["<s1>", "<s2>", "<s3>"],
    "weaknesses": ["<w1>", "<w2>", "<w3>"],
    "opportunities": ["<o1>", "<o2>"],
    "threats": ["<t1>", "<t2>"]
  },
  "moat_analysis": "<paragraph on their defensibility based on Crustdata signals>",
  "attack_vectors": ["<vulnerability 1>", "<vulnerability 2>", "<vulnerability 3>"],
  "ai_playbook": ["<action 1>", "<action 2>", "<action 3>"],
  "hiring_intent": "<what their job posts reveal about their 6-month strategy>"
}`;

  const raw = await callClaude({
    systemPrompt,
    userPrompt,
    tools: CRUSTDATA_TOOLS,
    apiKey: activeClaude,
    crustKey: activeCrust,
    maxIterations: 8,
  });

  return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
}

// ── Market Position Analysis ────────────────────────────────

export async function analyzeMarketPosition(company, competitors, apiKey = null, crustKey = null) {
  const activeClaude = apiKey || (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : null);
  const activeCrust = crustKey || (typeof process !== 'undefined' ? process.env.CRUSTDATA_API_KEY : null);

  const validClaude = hasValidClaudeKey(activeClaude);
  const validCrust = hasValidCrustKey(activeCrust);

  if (validCrust && !validClaude) {
    throw new Error('Anthropic Claude API key is not added. Please click the settings icon (⚙) at the top right and configure a valid Claude API key.');
  }

  if (!validClaude) {
    return getMockMarketPosition(company, competitors);
  }

  const systemPrompt = `You are a market analyst. Use Crustdata tools to get live headcount 
and funding data for all companies. Return ONLY valid JSON.`;

  const userPrompt = `Analyze the competitive market position for ${company.name} vs its competitors.

Company: ${JSON.stringify(company)}
Competitors: ${JSON.stringify(competitors)}

Use tools to verify/update headcount data for each competitor, then return:
{
  "market_summary": "<2-3 sentences on the competitive landscape>",
  "position_score": <1-10, where 10 = market leader>,
  "fastest_growing_competitor": "<name>",
  "biggest_threat": "<name and why>",
  "best_opportunity": "<specific market gap to exploit>",
  "competitor_snapshots": [
    { "name": "<name>", "headcount": <n>, "growth_pct": <n>, "threat_level": "<level>", "key_signal": "<what Crustdata shows>" }
  ]
}`;

  const raw = await callClaude({
    systemPrompt,
    userPrompt,
    tools: CRUSTDATA_TOOLS,
    apiKey: activeClaude,
    crustKey: activeCrust,
    maxIterations: 6,
  });

  return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
}

// ── Talent Flow Intelligence (agentic) ──────────────────────

export async function analyzeTalentFlow(fromCompany, toCompany, apiKey = null, crustKey = null) {
  const activeClaude = apiKey || (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : null);
  const activeCrust = crustKey || (typeof process !== 'undefined' ? process.env.CRUSTDATA_API_KEY : null);

  const validClaude = hasValidClaudeKey(activeClaude);
  const validCrust = hasValidCrustKey(activeCrust);

  if (validCrust && !validClaude) {
    throw new Error('Anthropic Claude API key is not added. Please click the settings icon (⚙) at the top right and configure a valid Claude API key.');
  }

  if (!validClaude) {
    return getMockTalentFlow(fromCompany, toCompany);
  }

  const systemPrompt = `You are a talent intelligence analyst. Use Crustdata people search to 
find real executive and key talent movements. Return ONLY valid JSON.`;

  const userPrompt = `Find recent talent movements from ${fromCompany} to ${toCompany}.

Use search_people with previous_company="${fromCompany}" and current_company="${toCompany}".
Also search for senior hires with title_keywords="VP OR Director OR Head OR CTO OR CPO".

Return:
{
  "moves_found": <number>,
  "senior_moves": [
    { "name": "<name or anonymous>", "previous_title": "<title>", "new_title": "<title>", "signal": "<what this means>" }
  ],
  "pattern": "<what this talent flow pattern suggests strategically>",
  "risk_level": "high|medium|low"
}`;

  const raw = await callClaude({
    systemPrompt,
    userPrompt,
    tools: CRUSTDATA_TOOLS,
    apiKey: activeClaude,
    crustKey: activeCrust,
    maxIterations: 4,
  });

  return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
}

// ── Mock Fallback Generators (Case 1) ───────────────────────

export function getMockSignalAnalysis(signal) {
  return {
    severity: signal.severity || 'medium',
    impact_score: signal.severity === 'critical' ? 9 : signal.severity === 'high' ? 7 : 5,
    summary: signal.description || 'Hiring spike observed at competitor enterprise entity.',
    recommended_actions: [
      'Monitor talent inflows from other competitors',
      'Verify target product alignment schemas',
      'Alert GTM sales teams of competitive account campaigns'
    ],
    time_sensitivity: 'this_week',
    crustdata_insights: 'Demo Mode (Mock data fallback active). Set API keys to resolve live insights.',
    competitive_angle: signal.ai_analysis || 'No live AI analysis running — falling back to mock signal brief.'
  };
}

export async function getMockBrief() {
  return INTEL_BRIEFS[0];
}

export function getMockMarketPosition(company, competitors) {
  return {
    market_summary: 'Crustdata continues to expand its real-time indexing pipeline. Competitor Apollo is growing, posing a high long-term GTM challenge.',
    position_score: 7,
    fastest_growing_competitor: 'Apollo.io',
    biggest_threat: 'Apollo.io (22.4% headcount growth)',
    best_opportunity: 'Enterprise accounts looking to migrate from ZoomInfo',
    competitor_snapshots: competitors.map((c) => ({
      name: c.name,
      headcount: c.headcount,
      growth_pct: c.headcount_growth_6m,
      threat_level: c.threat_level,
      key_signal: 'Hiring surges indicate new AI product pushes.'
    }))
  };
}

export function getMockTalentFlow(fromCompany, toCompany) {
  const movesCount = Math.floor(Math.random() * 5) + 2;
  return {
    moves_found: movesCount,
    senior_moves: [
      {
        name: '[Anonymized] Staff Software Engineer',
        previous_title: 'Tech Lead — Data Infrastructure',
        new_title: 'Senior Infrastructure SWE',
        signal: `Transfers database pipeline experience from ${fromCompany} to ${toCompany}.`
      },
      {
        name: '[Anonymized] Engineering Manager',
        previous_title: 'Senior SWE Manager',
        new_title: 'VP of Engineering',
        signal: 'Strengthens enterprise platform scaling.'
      }
    ],
    pattern: `Identified migration vectors from ${fromCompany} to ${toCompany}. Focus areas center around expanding backend query throughput and optimizing entity-resolution algorithms.`,
    risk_level: 'medium'
  };
}

export function getMockSWOT(company) {
  const name = company.name || 'Competitor';
  
  if (name.toLowerCase().includes('apollo')) {
    return {
      threat_level: 'high',
      crustdata_snapshot: {
        headcount: 1200,
        headcount_growth_pct: 22.4,
        recent_funding_usd: 251000000,
        open_roles_count: 34
      },
      swot: {
        strengths: [
          'Large sales contacts directory spanning 275M+ profiles',
          'Well funded with $251M raised to support platform expansions',
          'Comprehensive outbound GTM tools integrated inside the platform'
        ],
        weaknesses: [
          'Frequent data rate-limits causing developer account churn',
          'Enrichment latency lags behind raw real-time scraping providers',
          'Legacy search queries are slow under heavy user concurrency'
        ],
        opportunities: [
          'Launching an autonomous developer SDK with structured model outputs',
          'Deploying native buyer intent signals from web search indexing',
          'Expanding developer-centric data pipelines'
        ],
        threats: [
          'Losing market shares to agile workbook builders like Clay',
          'Tighter GDPR regulations impacting profile collection',
          'Incumbents locking in enterprise customers via bundled pricing'
        ]
      },
      moat_analysis: 'Defensibility lies in its massive volume of contacts. Moderately stable, but vulnerable to high-frequency live data API developers.',
      attack_vectors: [
        'Target clients requiring fresh signal changes',
        'Market a zero-rate-limit developer lookup API',
        'Focus sales messaging on entity match accuracy'
      ],
      ai_playbook: [
        'Build custom agents to automate target list generations',
        'Deepen API connections with GTM orchestrators',
        'Track and contact Apollo clients experiencing rate-limit churn'
      ],
      hiring_intent: 'Hiring heavily in AI engineering and enterprise account executives to expand the platform.'
    };
  }

  if (name.toLowerCase().includes('zoominfo')) {
    return {
      threat_level: 'high',
      crustdata_snapshot: {
        headcount: 3500,
        headcount_growth_pct: -14.6,
        recent_funding_usd: 500000000,
        open_roles_count: 15
      },
      swot: {
        strengths: [
          'Pioneer brand in B2B intelligence with deep market penetration',
          'Large direct GTM enterprise sales pipeline',
          'Extensive database mapping structures'
        ],
        weaknesses: [
          'Negative growth trend with recent 15% headcount reductions',
          'Stale company directories and monthly-frequency refresh limits',
          'High subscription pricing barriers forcing customer churn'
        ],
        opportunities: [
          'Automating GTM signals around autonomous agent builders',
          'Refining crawler indexing speeds for high-frequency updates',
          'Offering cloud database sync formats'
        ],
        threats: [
          'Accelerating customer migration to startups and API engines',
          'Talent outflow of senior pipeline architects to competitors',
          'Decline in enterprise directory platform value'
        ]
      },
      moat_analysis: 'Strong contractual switching barriers in enterprise segments, but GTM systems are increasingly migrating to lightweight integrations.',
      attack_vectors: [
        'Initiate outreach to ZoomInfo accounts near renewal deadlines',
        'Highlight real-time signal fresh metrics in comparison sales pitches',
        'Recruit experienced data pipeline engineers departing ZoomInfo'
      ],
      ai_playbook: [
        'Track ZoomInfo customer churn triggers systematically',
        'Create target corporate profiles using semantic LLM filters',
        'Automate lead imports based on competitor staff exits'
      ],
      hiring_intent: 'Hiring is limited, focus is on operational cost reduction and GTM consolidation.'
    };
  }

  if (name.toLowerCase().includes('lusha')) {
    return {
      threat_level: 'medium',
      crustdata_snapshot: {
        headcount: 350,
        headcount_growth_pct: -7.9,
        recent_funding_usd: 205000000,
        open_roles_count: 8
      },
      swot: {
        strengths: [
          'Extremely popular browser extension tool for GTM practitioners',
          'Simple, clean onboarding workflow',
          'Strong contact data coverage in core domains'
        ],
        weaknesses: [
          'Fails to offer real-time company signal indicators or APIs',
          'Customer churn in mid-market due to competition',
          'Limited GTM workflow automation outside contacts lookups'
        ],
        opportunities: [
          'Expanding CRM direct integration endpoints',
          'Developing custom lead score models using machine learning',
          'Releasing a developer enrichment webhook API'
        ],
        threats: [
          'B2B directories consolidating into larger platforms',
          'Browser extensions facing tighter permission controls',
          'Real-time crawling platforms making static directory exports obsolete'
        ]
      },
      moat_analysis: 'Moat is built on browser extension usage and ease of onboarding. Low defensibility against API-first competitors.',
      attack_vectors: [
        'Target developers looking for structured company API triggers',
        'Pitch users seeking deeper corporate metadata over contact details',
        'Offer discounts for teams migrating off Lusha subscriptions'
      ],
      ai_playbook: [
        'Extract leads dynamically from competitor talent movement indicators',
        'Match user query intents using vector databases',
        'Optimize lead workflows via custom Claude prompts'
      ],
      hiring_intent: 'Hiring is stable with minor focus on customer support and mid-market sales.'
    };
  }

  // Generic fallback SWOT (for Lusha, Stripe, or any other company queried)
  return {
    threat_level: company.threat_level || 'medium',
    crustdata_snapshot: {
      headcount: company.headcount || 100,
      headcount_growth_pct: company.headcount_growth_6m || 10.0,
      recent_funding_usd: company.funding_total_usd || null,
      open_roles_count: company.open_roles_count || 4
    },
    swot: {
      strengths: [
        `Stable product positioning inside the ${company.industry || 'technology'} vertical`,
        'Loyal core customer cohort',
        'Agile development cycles enabling rapid releases'
      ],
      weaknesses: [
        'High crawling infrastructure bills for live monitoring',
        'Relying on public data aggregators which have compliance risks',
        'No direct GTM sales channels'
      ],
      opportunities: [
        'Deploying autonomous AI SDR loops on top of their core API',
        'Entering adjacent mid-market segments',
        'Enhancing GTM tracking signals'
      ],
      threats: [
        'Price pressure from larger database vendors',
        'Changes in API access rules from primary data sources',
        'Incumbents releasing competitive features for free'
      ]
    },
    moat_analysis: 'The defensive moat is moderate and driven by niche customer retention. Vulnerable to fast-following competitors and API consolidators.',
    attack_vectors: [
      'Focus marketing campaigns on their core weaknesses',
      'Provide developer-first API alternatives for enrichment',
      'Target adjacent customer verticals they have neglected'
    ],
    ai_playbook: [
      'Use semantic filters to automatically enrich competitor target profiles',
      'Track engineering job postings to detect product launches early',
      'Deploy autonomous lead response loops'
    ],
    hiring_intent: 'Hiring is focused on core product engineering and direct sales roles.'
  };
}
