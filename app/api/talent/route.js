// ============================================================
// POST /api/talent — Claude agentic talent flow analysis
// Claude uses Crustdata people search as a tool
// ============================================================

import { analyzeTalentFlow, getMockTalentFlow, hasValidClaudeKey } from '@/lib/ai';
import { hasValidCrustKey } from '@/lib/crustdata';

export async function POST(request) {
  try {
    const body = await request.json();
    const { from_company, to_company, apiKey, crustKey } = body;

    if (!from_company || !to_company) {
      return Response.json({ error: 'from_company and to_company are required' }, { status: 400 });
    }

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
          error: 'Anthropic Claude API key is not added. To run live talent flow analyses, please click the settings icon (⚙) at the top right and enter a valid Claude API key.',
          isKeyError: true
        },
        { status: 401 }
      );
    }

    // Case 1: No API keys at all (or both invalid) -> Return mock talent analysis
    if (!validCrust && !validClaude) {
      const result = getMockTalentFlow(from_company, to_company);
      return Response.json({ result, timestamp: new Date().toISOString(), model: 'mock-mode' });
    }

    // Case 3: Claude active (Crust optional — mock tool fallback)
    const result = await analyzeTalentFlow(from_company, to_company, activeClaude, activeCrust);
    return Response.json({ result, timestamp: new Date().toISOString(), model: 'claude-sonnet-4' });

  } catch (err) {
    const isKeyError = err.message?.toLowerCase().includes('api key') || err.message?.includes('401');
    return Response.json(
      {
        error: isKeyError
          ? 'Claude API key is not added. Please click the settings icon (⚙) at the top right and configure a valid Claude API key.'
          : err.message || 'Talent analysis failed',
      },
      { status: isKeyError ? 401 : 500 }
    );
  }
}
