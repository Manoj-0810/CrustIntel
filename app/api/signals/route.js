// ============================================================
// GET /api/signals — Return filtered competitive signals
// ============================================================

import { getSignals } from '@/lib/crustdata';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get('severity');
  const type = searchParams.get('type');
  const company_id = searchParams.get('company_id');

  const filters = {};
  if (severity) filters.severity = severity;
  if (type) filters.type = type;
  if (company_id) filters.company_id = company_id;

  const signals = getSignals(filters);

  return Response.json({
    signals,
    total: signals.length,
    timestamp: new Date().toISOString(),
  });
}
