// ============================================================
// POST /api/company — Fetch live company details from Crustdata
// ============================================================

import { callCrustdata, hasValidCrustKey, getTrackedCompany, getCompetitors } from '@/lib/crustdata';

export const maxDuration = 60;

export async function POST(request) {
  let query = '';
  try {
    const body = await request.json();
    const { company_name, domain, crustKey } = body;
    query = domain || company_name;

    const activeCrustKey = crustKey || process.env.CRUSTDATA_API_KEY || null;

    if (!hasValidCrustKey(activeCrustKey)) {
      return Response.json(
        { error: 'No valid Crustdata key provided' },
        { status: 400 }
      );
    }

    // Call search_companies tool to get the detailed metrics
    const results = await callCrustdata('search_companies', { query, limit: 1 }, activeCrustKey);

    if (!results || results.length === 0) {
      return Response.json(
        { error: `Company "${query}" not found in Crustdata.` },
        { status: 404 }
      );
    }

    const companyData = results[0];

    return Response.json({
      company: companyData,
      timestamp: new Date().toISOString(),
      source: 'crustdata_live'
    });

  } catch (err) {
    console.error('Live company lookup failed, falling back to mock:', err.message);
    
    // Find mock fallback
    const allMock = [getTrackedCompany(), ...getCompetitors()];
    const mockCompany = allMock.find(
      (c) =>
        c.domain?.toLowerCase() === query.toLowerCase() ||
        c.name?.toLowerCase().includes(query.toLowerCase())
    );

    if (mockCompany) {
      return Response.json({
        company: mockCompany,
        timestamp: new Date().toISOString(),
        source: 'mock_data',
        note: `Crustdata API call failed (${err.message}). Fell back to mock data.`
      });
    }

    return Response.json(
      { error: err.message || 'Failed to fetch company details' },
      { status: 500 }
    );
  }
}
