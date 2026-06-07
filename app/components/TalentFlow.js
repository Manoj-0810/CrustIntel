'use client';

import { useState } from 'react';

export default function TalentFlow({ flows, onTalentAnalyzed }) {
  const [analyzing, setAnalyzing] = useState(null);
  const [agentResults, setAgentResults] = useState({});
  const [error, setError] = useState(null);

  const handleAnalyze = async (flow) => {
    const key = `${flow.from_company}→${flow.to_company}`;
    if (agentResults[key]) return; // already fetched

    setAnalyzing(key);
    setError(null);

    try {
      const claudeKey = (() => {
        try { return localStorage.getItem('crustintel_claude_key'); } catch { return null; }
      })();
      const crustKey = (() => {
        try { return localStorage.getItem('crustintel_crust_key'); } catch { return null; }
      })();

      const res = await fetch('/api/talent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_company: flow.from_company,
          to_company: flow.to_company,
          apiKey: claudeKey,
          crustKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setAgentResults((prev) => ({ ...prev, [key]: data.result }));
      if (onTalentAnalyzed) {
        onTalentAnalyzed(data.result.moves_found || 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="double-bezel talent-flow-panel" id="talent-flow">
      <div className="double-bezel-inner">
        <div className="section-header" style={{ padding: '8px 0 12px' }}>
          <div className="section-title">
            <span className="section-title-icon">🔄</span>
            Talent Flow
          </div>
          <span className="section-badge">{flows.length} tracked</span>
        </div>

        {error && (
          <div style={{
            fontSize: 11, color: 'var(--severity-critical)',
            background: 'rgba(239,68,68,0.08)', borderRadius: 6,
            padding: '6px 10px', marginBottom: 8,
          }}>
            {error}
          </div>
        )}

        <div className="talent-flow-list" style={{ padding: 0 }}>
          {flows.map((flow) => {
            const key = `${flow.from_company}→${flow.to_company}`;
            const result = agentResults[key];
            const isAnalyzing = analyzing === key;

            return (
              <div key={flow.id} className="talent-flow-item" id={`flow-${flow.id}`}
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="flow-from">{flow.from_company}</span>
                  <span className={`flow-arrow ${flow.direction === 'inflow' ? 'inflow' : flow.direction === 'outflow' ? 'outflow' : ''}`}>→</span>
                  <span className="flow-to">{flow.to_company}</span>
                  <span className="flow-roles" title={flow.roles.join(', ')} style={{ flex: 1 }}>
                    {flow.roles.join(', ')}
                  </span>
                  <span className="flow-count">{flow.count}</span>
                  <button
                    onClick={() => handleAnalyze(flow)}
                    disabled={isAnalyzing || !!result}
                    style={{
                      fontSize: 10, padding: '2px 7px',
                      background: result ? 'rgba(34,211,153,0.1)' : 'rgba(99,102,241,0.12)',
                      border: `1px solid ${result ? 'rgba(34,211,153,0.3)' : 'rgba(99,102,241,0.3)'}`,
                      borderRadius: 4, color: result ? 'var(--accent-emerald)' : 'var(--brand-secondary)',
                      cursor: result || isAnalyzing ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isAnalyzing ? '…' : result ? '✓ Done' : '🧠 Analyse'}
                  </button>
                </div>

                {result && (
                  <div style={{
                    fontSize: 11, color: 'var(--text-secondary)',
                    background: 'rgba(99,102,241,0.05)',
                    border: '1px solid rgba(99,102,241,0.12)',
                    borderRadius: 6, padding: '8px 10px', marginTop: 2,
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--brand-secondary)', marginBottom: 3 }}>
                      Claude × Crustdata — {result.moves_found} moves detected
                    </div>
                    <div style={{ lineHeight: 1.5 }}>{result.pattern}</div>
                    <div style={{
                      marginTop: 4, display: 'inline-block',
                      padding: '2px 6px', borderRadius: 4, fontSize: 10,
                      background: result.risk_level === 'high' ? 'rgba(239,68,68,0.12)' : result.risk_level === 'medium' ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)',
                      color: result.risk_level === 'high' ? 'var(--severity-critical)' : result.risk_level === 'medium' ? 'var(--severity-medium)' : 'var(--severity-low)',
                    }}>
                      {result.risk_level} risk
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
