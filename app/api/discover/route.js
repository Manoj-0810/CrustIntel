// ============================================================
// POST /api/discover — Auto-discover competitors for a domain
// ============================================================

import { discoverCompetitors } from '@/lib/crustdata';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const domain = body.domain;

    if (!domain) {
      return Response.json({ error: 'domain is required' }, { status: 400 });
    }

    const result = await discoverCompetitors(domain);

    return Response.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      { error: err.message || 'Discovery failed' },
      { status: 500 }
    );
  }
}
