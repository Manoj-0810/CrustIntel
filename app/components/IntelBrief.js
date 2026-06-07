'use client';

import { useState } from 'react';

export default function IntelBrief({ briefs }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const brief = briefs[activeIndex];

  if (!brief) return null;

  const circumference = 2 * Math.PI * 42;
  const scorePct = (brief.threat_score / 10) * circumference;

  return (
    <div className="double-bezel intel-panel" id="intel-panel" style={{ maxHeight: '500px' }}>
      <div className="double-bezel-inner" style={{ padding: 0 }}>
        <div className="intel-header" style={{ padding: '16px 20px 12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="intel-title">🧠 {brief.title}</div>
              <div className="intel-subtitle">{brief.subtitle}</div>
            </div>
            {briefs.length > 1 && (
              <div className="brief-dots-container">
                {briefs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`brief-dot ${i === activeIndex ? 'active' : ''}`}
                    id={`brief-dot-${i}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="intel-body" key={activeIndex} style={{ padding: '16px 20px 20px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Threat Score Ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            <div className="threat-ring">
              <svg viewBox="0 0 100 100">
                <circle className="threat-ring-bg" cx="50" cy="50" r="42" strokeWidth="6" />
                <circle
                  className="threat-ring-fill"
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={brief.threat_score >= 7 ? 'var(--severity-critical)' : brief.threat_score >= 4 ? 'var(--severity-high)' : 'var(--severity-low)'}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - scorePct}
                  strokeWidth="6"
                />
              </svg>
              <div
                className="threat-ring-value"
                style={{
                  color: brief.threat_score >= 7 ? 'var(--severity-critical)' : brief.threat_score >= 4 ? 'var(--severity-high)' : 'var(--severity-low)',
                }}
              >
                {brief.threat_score}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Overall Threat
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {brief.threat_score >= 7 ? 'High competitive pressure' : brief.threat_score >= 4 ? 'Moderate — watch closely' : 'Low — strong position'}
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="intel-summary">{brief.executive_summary}</div>

          {/* Sections */}
          {brief.sections?.map((section, i) => (
            <div key={i} className="intel-section">
              <div className="intel-section-heading">{section.heading}</div>
              <div className="intel-section-content">{section.content}</div>
            </div>
          ))}

          {/* Key Risks */}
          {brief.key_risks?.length > 0 && (
            <div className="intel-section">
              <div className="intel-section-heading">⚠ Key Risks</div>
              <ul className="intel-risks">
                {brief.key_risks.map((risk, i) => (
                  <li key={i} className="intel-risk-item">{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {brief.recommended_actions?.length > 0 && (
            <div className="intel-section">
              <div className="intel-section-heading">✅ Recommended Actions</div>
              <ul className="intel-actions">
                {brief.recommended_actions.map((action, i) => (
                  <li key={i} className="intel-action-item">{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
