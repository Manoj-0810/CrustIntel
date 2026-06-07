// ============================================================
// POST /api/analyze — Claude agentic signal analysis & brief gen
// Uses Claude tool-use to autonomously query Crustdata
// ============================================================

import {
  analyzeSignal,
  generateBrief,
  analyzeMarketPosition,
  hasValidClaudeKey,
  getMockBrief,
  getMockSignalAnalysis,
  getMockMarketPosition
} from '@/lib/ai';
import { getTrackedCompany, getCompetitors, getSignals, hasValidCrustKey } from '@/lib/crustdata';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, signal, apiKey, crustKey } = body;

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
          error: 'Anthropic Claude API key is not added. To run live AI signal analysis or compile briefs, please click the settings icon (⚙) at the top right and enter a valid Claude API key.',
          isKeyError: true
        },
        { status: 401 }
      );
    }

    const company = getTrackedCompany();
    const competitors = getCompetitors();

    // Case 1: No API keys at all (or both invalid) -> Return mock responses
    if (!validCrust && !validClaude) {
      if (action === 'analyze_signal') {
        if (!signal) return Response.json({ error: 'signal object required' }, { status: 400 });
        const analysis = getMockSignalAnalysis(signal);
        return Response.json({ analysis, timestamp: new Date().toISOString(), model: 'mock-mode' });
      }
      if (action === 'generate_brief') {
        const brief = await getMockBrief();
        return Response.json({ brief, timestamp: new Date().toISOString(), model: 'mock-mode' });
      }
      if (action === 'market_position') {
        const position = getMockMarketPosition(company, competitors);
        return Response.json({ position, timestamp: new Date().toISOString(), model: 'mock-mode' });
      }
    }

    // Case 3: Claude active (Crust optional — mock tool fallback)
    if (action === 'analyze_signal') {
      if (!signal) return Response.json({ error: 'signal object required' }, { status: 400 });
      const analysis = await analyzeSignal(signal, company, activeClaude, activeCrust);
      return Response.json({ analysis, timestamp: new Date().toISOString(), model: 'claude-sonnet-4' });
    }

    if (action === 'generate_brief') {
      const signals = getSignals();
      const brief = await generateBrief(signals, company, competitors, activeClaude, activeCrust);
      return Response.json({ brief, timestamp: new Date().toISOString(), model: 'claude-sonnet-4' });
    }

    if (action === 'market_position') {
      const position = await analyzeMarketPosition(company, competitors, activeClaude, activeCrust);
      return Response.json({ position, timestamp: new Date().toISOString(), model: 'claude-sonnet-4' });
    }

    return Response.json(
      { error: 'action must be: analyze_signal | generate_brief | market_position' },
      { status: 400 }
    );
  } catch (err) {
    const isKeyError = err.message?.toLowerCase().includes('api key') || err.message?.includes('401');
    return Response.json(
      {
        error: isKeyError
          ? 'Claude API key is not added. Please click the settings icon (⚙) at the top right and configure a valid Claude API key.'
          : err.message || 'Analysis failed',
      },
      { status: isKeyError ? 401 : 500 }
    );
  }
}
