// ============================================================
// lib/crustdata.js — Crustdata API Client
// Real API calls when CRUSTDATA_API_KEY is set + USE_REAL_API=true
// Falls back to rich mock data for local dev / demo.
// ============================================================

const CRUSTDATA_BASE = process.env.CRUSTDATA_API_URL || 'https://api.crustdata.com';
const USE_REAL_API = process.env.USE_REAL_API === 'true';
const API_KEY = process.env.CRUSTDATA_API_KEY;

// Helper to validate if key is valid (not a default placeholder or empty)
export function hasValidCrustKey(key) {
  if (!key) return false;
  const k = key.trim();
  if (!k || k === 'your_crustdata_api_key_here' || k === 'crustdata_live_...' || k.length < 10) return false;
  return true;
}

function crustHeaders(crustKey = null) {
  const activeKey = crustKey || API_KEY;
  const version = process.env.CRUSTDATA_API_VERSION || '2025-11-01';
  return {
    'Content-Type': 'application/json',
    Authorization: `Token ${activeKey}`,
    'X-Crustdata-Version': version,
    'x-api-version': version,
  };
}

function handleNonOkResponse(res, serviceName) {
  let detail = '';
  if (res.status === 402) {
    detail = ' (Payment Required / Limit Exceeded - Quota or credits on your Crustdata API key have been exceeded)';
  } else if (res.status === 401) {
    detail = ' (Unauthorized - Your Crustdata API key is invalid or expired)';
  } else if (res.status === 429) {
    detail = ' (Rate Limit Exceeded - Too many requests to the Crustdata API)';
  } else if (res.status === 400) {
    detail = ' (Bad Request - Invalid query structure or filter type sent to Crustdata)';
  } else if (res.status === 403) {
    detail = ' (Forbidden - Your Crustdata API key lacks permissions for this action)';
  } else if (res.status >= 500) {
    detail = ' (Server Error - Crustdata services are experiencing technical issues)';
  }
  throw new Error(`Crustdata ${serviceName} failed: ${res.status}${detail}`);
}

// ── Helper functions for company enrichment mapping ─────────

function parseHeadcount(companyData) {
  if (companyData.headcount && typeof companyData.headcount.total === 'number') {
    return companyData.headcount.total;
  }
  const range = companyData.basic_info?.employee_count_range;
  if (range) {
    if (range.toLowerCase() === 'myself only') return 1;
    const parts = range.split('-');
    if (parts.length === 2) {
      const low = parseInt(parts[0], 10);
      const high = parseInt(parts[1], 10);
      if (!isNaN(low) && !isNaN(high)) {
        return Math.floor((low + high) / 2);
      }
    }
    const plusIndex = range.indexOf('+');
    if (plusIndex !== -1) {
      const num = parseInt(range.substring(0, plusIndex), 10);
      if (!isNaN(num)) return num;
    }
    const val = parseInt(range, 10);
    if (!isNaN(val)) return val;
  }
  return null;
}

function mapCrustdataCompany(companyData) {
  const info = companyData.basic_info || {};
  const headcountVal = parseHeadcount(companyData);
  const fundingVal = companyData.funding?.total_funding_raised_usd || null;
  const fundingStageVal = companyData.funding?.latest_funding_stage || null;
  const industryVal = info.industries && info.industries.length > 0 ? info.industries[0] : null;
  const descriptionVal = info.description || null;
  const hqLocationVal = companyData.locations?.city || companyData.locations?.state || companyData.locations?.country || null;
  
  return {
    id: companyData.crustdata_company_id,
    name: info.name || null,
    domain: info.primary_domain || (info.all_domains && info.all_domains[0]) || null,
    headcount: headcountVal,
    headcount_growth_6m: companyData.headcount?.growth_6_months_percent || null,
    funding_total_usd: fundingVal,
    funding_stage: fundingStageVal,
    hq_location: hqLocationVal,
    description: descriptionVal,
    industry: industryVal,
    founded_year: info.year_founded || null,
    revenue_estimate_usd: companyData.revenue?.estimated?.lower_bound_usd || null,
  };
}

// ── Real Crustdata API calls ────────────────────────────────

async function realSearchCompanies({ query, limit = 5 }, crustKey = null) {
  const isDomain = query.includes('.') && !query.includes(' ');
  const body = isDomain ? { domains: [query] } : { names: [query] };

  const res = await fetch(`${CRUSTDATA_BASE}/company/enrich`, {
    method: 'POST',
    headers: crustHeaders(crustKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) handleNonOkResponse(res, 'search');
  const data = await res.json();

  const matches = [];
  if (data && Array.isArray(data)) {
    for (const item of data) {
      if (item.matches && Array.isArray(item.matches)) {
        for (const match of item.matches) {
          if (match.company_data) {
            matches.push(mapCrustdataCompany(match.company_data));
          }
        }
      }
    }
  }
  return matches.slice(0, limit);
}

async function realGetCompanyHeadcount({ company_name, domain }, crustKey = null) {
  const query = domain || company_name;
  const isDomain = query.includes('.') && !query.includes(' ');
  const body = isDomain ? { domains: [query] } : { names: [query] };

  const res = await fetch(`${CRUSTDATA_BASE}/company/enrich`, {
    method: 'POST',
    headers: crustHeaders(crustKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) handleNonOkResponse(res, 'headcount');
  const data = await res.json();

  let firstMatch = null;
  if (data && Array.isArray(data)) {
    for (const item of data) {
      if (item.matches && Array.isArray(item.matches)) {
        const m = item.matches.find(match => match.company_data);
        if (m) {
          firstMatch = m.company_data;
          break;
        }
      }
    }
  }

  if (!firstMatch) return { error: 'Company not found' };

  return {
    company_name: firstMatch.basic_info?.name || company_name,
    headcount: parseHeadcount(firstMatch),
    headcount_growth_6m: firstMatch.headcount?.growth_6_months_percent || null,
    headcount_growth_12m: firstMatch.headcount?.growth_12_months_percent || null,
    source: 'crustdata_live',
    fetched_at: new Date().toISOString(),
  };
}

async function realSearchJobs({ company_name, department, limit = 10 }, crustKey = null) {
  const body = {
    filters: {
      field: "company.basic_info.name",
      type: "=",
      value: company_name
    },
    limit: 50
  };

  const res = await fetch(`${CRUSTDATA_BASE}/job/search`, {
    method: 'POST',
    headers: crustHeaders(crustKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) handleNonOkResponse(res, 'jobs');
  const data = await res.json();

  let jobs = (data.job_listings || []).map((j) => ({
    title: j.job_details?.title || 'Unknown Role',
    department: j.job_details?.category || 'Others',
    location: j.location?.raw || j.location?.city || j.location?.country || 'Remote / SF',
    posted_date: j.metadata?.date_added || new Date().toISOString(),
    seniority: 'Regular',
  }));

  if (department) {
    const deptLower = department.toLowerCase();
    jobs = jobs.filter(j => 
      j.department.toLowerCase().includes(deptLower) || 
      j.title.toLowerCase().includes(deptLower)
    );
  }

  return {
    company: company_name,
    total_open_roles: jobs.length,
    jobs: jobs.slice(0, limit),
    source: 'crustdata_live',
    fetched_at: new Date().toISOString(),
  };
}

async function realSearchPeople({ current_company, previous_company, title_keywords, limit = 10 }, crustKey = null) {
  const filters = [];
  if (current_company) {
    filters.push({ filter_type: 'CURRENT_COMPANY', type: 'in', value: [current_company] });
  }
  if (previous_company) {
    filters.push({ filter_type: 'PAST_COMPANY', type: 'in', value: [previous_company] });
  }
  if (title_keywords) {
    filters.push({ filter_type: 'CURRENT_TITLE', type: 'in', value: [title_keywords] });
  }

  const res = await fetch(`${CRUSTDATA_BASE}/screener/person/search`, {
    method: 'POST',
    headers: crustHeaders(crustKey),
    body: JSON.stringify({ filters, page: 1, limit }),
  });
  if (!res.ok) handleNonOkResponse(res, 'people search');
  const data = await res.json();

  return {
    total: data.total || (data.profiles ? data.profiles.length : 0),
    people: (data.profiles || []).map((p) => {
      const currentEmp = p.employer?.[0];
      const prevEmp = p.employer?.[1];
      return {
        name: p.name || 'Anonymized Professional',
        current_title: p.current_title || p.default_position_title || currentEmp?.title || 'Professional',
        current_company: currentEmp?.company_name || current_company || 'Current Company',
        previous_company: prevEmp?.company_name || previous_company || null,
        previous_title: prevEmp?.title || null,
        linkedin_url: p.flagship_profile_url || p.linkedin_profile_url || null,
        changed_at: currentEmp?.start_date || null,
      };
    }),
    source: 'crustdata_live',
    fetched_at: new Date().toISOString(),
  };
}

async function realGetFundingEvents({ company_name }, crustKey = null) {
  const isDomain = company_name.includes('.') && !company_name.includes(' ');
  const body = isDomain ? { domains: [company_name] } : { names: [company_name] };

  const res = await fetch(`${CRUSTDATA_BASE}/company/enrich`, {
    method: 'POST',
    headers: crustHeaders(crustKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) handleNonOkResponse(res, 'funding');
  const data = await res.json();

  let firstMatch = null;
  if (data && Array.isArray(data)) {
    for (const item of data) {
      if (item.matches && Array.isArray(item.matches)) {
        const m = item.matches.find(match => match.company_data);
        if (m) {
          firstMatch = m.company_data;
          break;
        }
      }
    }
  }

  if (!firstMatch) return { error: 'Company not found' };

  return {
    company_name: firstMatch.basic_info?.name || company_name,
    total_funding_usd: firstMatch.funding?.total_funding_raised_usd || null,
    latest_round: firstMatch.funding?.latest_funding_stage || null,
    latest_round_usd: firstMatch.funding?.latest_funding_amount_usd || null,
    latest_round_date: firstMatch.funding?.latest_funding_date || null,
    investors: firstMatch.funding?.investors || [],
    source: 'crustdata_live',
    fetched_at: new Date().toISOString(),
  };
}

// ── Mock fallback data (used when USE_REAL_API=false) ────────

import {
  TRACKED_COMPANY,
  COMPETITORS,
  SIGNALS,
  TALENT_FLOWS,
} from './mock-data.js';

function mockSearchCompanies({ query, limit = 5 }) {
  const q = query.toLowerCase();
  const all = [TRACKED_COMPANY, ...COMPETITORS];
  const matches = all.filter(
    (c) => c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q)
  );
  return matches.slice(0, limit);
}

function mockGetCompanyHeadcount({ company_name }) {
  const all = [TRACKED_COMPANY, ...COMPETITORS];
  const c = all.find((x) => x.name.toLowerCase().includes(company_name.toLowerCase()));
  if (!c) return { error: 'Company not found in mock data' };
  return {
    company_name: c.name,
    headcount: c.headcount,
    headcount_growth_6m: c.headcount_growth_6m,
    source: 'mock_data',
    note: 'Set USE_REAL_API=true in .env.local for live Crustdata data',
  };
}

function mockSearchJobs({ company_name, limit = 10 }) {
  const all = [TRACKED_COMPANY, ...COMPETITORS];
  const c = all.find((x) => x.name.toLowerCase().includes(company_name.toLowerCase()));
  const signals = SIGNALS.filter(
    (s) => s.type === 'hiring_surge' && s.company_name?.toLowerCase().includes(company_name.toLowerCase())
  );
  return {
    company: company_name,
    total_open_roles: c?.open_roles_count || Math.floor(Math.random() * 80) + 10,
    jobs: signals.slice(0, limit).map((s) => ({
      title: s.title,
      department: 'Engineering',
      location: 'Remote / SF',
      posted_date: s.timestamp,
      seniority: 'Senior',
    })),
    source: 'mock_data',
    note: 'Set USE_REAL_API=true in .env.local for live Crustdata data',
  };
}

function mockSearchPeople({ current_company, previous_company, limit = 10 }) {
  const flows = TALENT_FLOWS.filter((f) => {
    const matchCurrent = !current_company || f.to_company?.toLowerCase().includes(current_company.toLowerCase());
    const matchPrev = !previous_company || f.from_company?.toLowerCase().includes(previous_company.toLowerCase());
    return matchCurrent && matchPrev;
  });

  return {
    total: flows.reduce((sum, f) => sum + (f.count || 1), 0),
    people: flows.slice(0, limit).flatMap((f) =>
      (f.roles || ['Engineer']).map((role) => ({
        name: `[Anonymized] ${role}`,
        current_title: role,
        current_company: f.to_company,
        previous_company: f.from_company,
        changed_at: f.timestamp,
      }))
    ),
    source: 'mock_data',
    note: 'Set USE_REAL_API=true in .env.local for live Crustdata data',
  };
}

function mockGetFundingEvents({ company_name }) {
  const all = [TRACKED_COMPANY, ...COMPETITORS];
  const c = all.find((x) => x.name.toLowerCase().includes(company_name.toLowerCase()));
  if (!c) return { error: 'Company not found in mock data' };
  return {
    company_name: c.name,
    total_funding_usd: c.funding_total_usd,
    latest_round: c.funding_stage,
    latest_round_usd: c.latest_funding_usd,
    latest_round_date: c.latest_funding_date,
    source: 'mock_data',
    note: 'Set USE_REAL_API=true in .env.local for live Crustdata data',
  };
}

// ── Tool executor — called by the Claude agentic loop ────────

export async function callCrustdata(toolName, toolInput, crustKey = null) {
  const activeKey = crustKey || API_KEY;
  const isReal = (USE_REAL_API || !!crustKey) && hasValidCrustKey(activeKey);

  if (isReal) {
    switch (toolName) {
      case 'search_companies': return realSearchCompanies(toolInput, activeKey);
      case 'get_company_headcount': return realGetCompanyHeadcount(toolInput, activeKey);
      case 'search_jobs': return realSearchJobs(toolInput, activeKey);
      case 'search_people': return realSearchPeople(toolInput, activeKey);
      case 'get_funding_events': return realGetFundingEvents(toolInput, activeKey);
      default: throw new Error(`Unknown Crustdata tool: ${toolName}`);
    }
  } else {
    // Mock fallback — works with zero API keys
    switch (toolName) {
      case 'search_companies': return mockSearchCompanies(toolInput);
      case 'get_company_headcount': return mockGetCompanyHeadcount(toolInput);
      case 'search_jobs': return mockSearchJobs(toolInput);
      case 'search_people': return mockSearchPeople(toolInput);
      case 'get_funding_events': return mockGetFundingEvents(toolInput);
      default: throw new Error(`Unknown Crustdata tool: ${toolName}`);
    }
  }
}

// ── Public helpers (used by API routes directly) ─────────────

export function getTrackedCompany() { return TRACKED_COMPANY; }
export function getCompetitors() { return COMPETITORS; }
export function getSignals(filters = {}) {
  let signals = [...SIGNALS];
  if (filters.severity) signals = signals.filter((s) => s.severity === filters.severity);
  if (filters.type) signals = signals.filter((s) => s.type === filters.type);
  if (filters.company_id) signals = signals.filter((s) => s.company_id === filters.company_id);
  return signals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function discoverCompetitors(domain, crustKey = null) {
  const activeKey = crustKey || API_KEY;
  const isReal = (USE_REAL_API || !!crustKey) && hasValidCrustKey(activeKey);

  if (isReal) {
    try {
      const results = await realSearchCompanies({ query: domain, limit: 8 }, activeKey);
      return { competitors: results, source: 'crustdata_live' };
    } catch (e) {
      console.error('Crustdata discover failed, using mock:', e.message);
    }
  }
  return {
    competitors: COMPETITORS,
    source: 'mock_data',
    note: 'Set USE_REAL_API=true in .env.local for live discovery',
  };
}
