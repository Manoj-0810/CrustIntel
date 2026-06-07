// ============================================================
// POST /api/deepdive — Claude agentic competitor deep dive
// Claude autonomously calls Crustdata tools to gather live data
// ============================================================

import { analyzeDeepDive, hasValidClaudeKey, getMockSWOT } from '@/lib/ai';
import { getCompetitors, hasValidCrustKey } from '@/lib/crustdata';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const { company, apiKey, crustKey } = body;

    if (!company) return Response.json({ error: 'company object required' }, { status: 400 });

    const browserHasClaude = hasValidClaudeKey(apiKey);
    const browserHasCrust = hasValidCrustKey(crustKey);

    const serverHasClaude = hasValidClaudeKey(process.env.ANTHROPIC_API_KEY);
    const serverHasCrust = hasValidCrustKey(process.env.CRUSTDATA_API_KEY);

    let activeClaude = null;
    let activeCrust = null;

    if (browserHasClaude || browserHasCrust) {
      activeClaude = browserHasClaude ? apiKey : null;
      activeCrust = browserHasCrust ? crustKey : null;
    } else if (serverHasClaude && serverHasCrust) {
      activeClaude = process.env.ANTHROPIC_API_KEY;
      activeCrust = process.env.CRUSTDATA_API_KEY;
    }

    const validClaude = hasValidClaudeKey(activeClaude);
    const validCrust = hasValidCrustKey(activeCrust);

    // Case 2: Crust Key present, Claude Key is NOT -> Show professional key error
    if (validCrust && !validClaude) {
      return Response.json(
        {
          error: 'Anthropic Claude API key is not added. To run live strategic SWOT deep dives, please click the settings icon (⚙) at the top right and enter a valid Claude API key.',
          isKeyError: true
        },
        { status: 401 }
      );
    }

    // Case 1: No API keys at all (or both invalid) -> Return mock SWOT analysis
    if (!validCrust && !validClaude) {
      const deepdive = getMockSWOT(company);
      return Response.json({ deepdive, timestamp: new Date().toISOString(), model: 'mock-mode' });
    }

    // Case 3: Claude active (Crust optional — mock tool fallback)
    const competitors = getCompetitors().filter((c) => c.id !== company.id);
    const deepdive = await analyzeDeepDive(company, competitors, activeClaude, activeCrust);
    return Response.json({ deepdive, timestamp: new Date().toISOString(), model: 'claude-sonnet-4' });

  } catch (err) {
    const isKeyError = err.message?.toLowerCase().includes('api key') || err.message?.includes('401');
    return Response.json(
      {
        error: isKeyError
          ? 'Claude API key is not added. Please click the settings icon (⚙) at the top right and configure a valid Claude API key.'
          : err.message || 'Deep dive failed',
      },
      { status: isKeyError ? 401 : 500 }
    );
  }
}
