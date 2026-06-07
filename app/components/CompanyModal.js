'use client';

import { useState, useEffect } from 'react';
import { formatNumber, formatCurrency, formatGrowth } from '@/lib/utils';

// Helper component for realistic logo
const CompanyLogo = ({ company, size = 48 }) => {
  const [error, setError] = useState(false);
  const url = company.domain ? `https://logo.clearbit.com/${company.domain}` : null;
  if (!url || error) {
    return <span style={{ fontSize: size * 0.6 }}>{company.logo_emoji || '🏢'}</span>;
  }
  return (
    <img
      src={url}
      alt={company.name}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: '8px',
        background: '#fff',
        padding: '3px',
        border: '1px solid var(--border-default)',
      }}
      onError={() => setError(true)}
    />
  );
};

export default function CompanyModal({ company, signals, onClose, onSWOTGenerated }) {
  const [deepDiveData, setDeepDiveData] = useState(null);
  const [loadingDeepDive, setLoadingDeepDive] = useState(false);
  const [errorDeepDive, setErrorDeepDive] = useState(null);
  const [liveCompany, setLiveCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Lock body scroll on mount and load live data if Crustdata key is present
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const loadLiveCompany = async () => {
      try {
        const crustKey = localStorage.getItem('crustintel_crust_key');
        if (!crustKey || !crustKey.trim()) {
          setLiveCompany(null); // Clear live details if key is removed
          return;
        }

        setLoadingCompany(true);
        const res = await fetch('/api/company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: company.name,
            domain: company.domain,
            crustKey: crustKey.trim()
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.company) {
            setLiveCompany(data.company);
          }
        }
      } catch (err) {
        console.error('Failed to load live company metrics:', err);
      } finally {
        setLoadingCompany(false);
      }
    };

    loadLiveCompany();

    // Re-check in real-time when settings are changed
    const handleKeyUpdate = () => {
      loadLiveCompany();
    };

    window.addEventListener('storage', handleKeyUpdate);
    window.addEventListener('focus', handleKeyUpdate);
    window.addEventListener('crustintel:keys-saved', handleKeyUpdate);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('storage', handleKeyUpdate);
      window.removeEventListener('focus', handleKeyUpdate);
      window.removeEventListener('crustintel:keys-saved', handleKeyUpdate);
    };
  }, [company]);

  if (!company) return null;

  const displayedCompany = liveCompany || company;
  const displayedHeadcount = deepDiveData?.crustdata_snapshot?.headcount ?? displayedCompany.headcount;
  const displayedGrowthVal = deepDiveData?.crustdata_snapshot?.headcount_growth_pct ?? displayedCompany.headcount_growth_6m;
  const growth = formatGrowth(displayedGrowthVal);
  const displayedFunding = deepDiveData?.crustdata_snapshot?.recent_funding_usd ?? displayedCompany.funding_total_usd;

  const companySignals = signals?.filter((s) => s.company_id === company.id) || [];

  const handleDeepDive = async () => {
    setLoadingDeepDive(true);
    setErrorDeepDive(null);
    const claudeKey = (() => { try { return localStorage.getItem('crustintel_claude_key'); } catch { return null; } })();
    const crustKey = (() => { try { return localStorage.getItem('crustintel_crust_key'); } catch { return null; } })();
    try {
      const res = await fetch('/api/deepdive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: displayedCompany, apiKey: claudeKey, crustKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate deep dive');
      setDeepDiveData(data.deepdive);
      if (onSWOTGenerated) {
        onSWOTGenerated(data.deepdive.threat_level);
      }
    } catch (err) {
      setErrorDeepDive(err.message);
    } finally {
      setLoadingDeepDive(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      id="company-modal"
    >
      <div
        className="double-bezel modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', padding: '12px' }}
      >
        <div className="double-bezel-inner" style={{ position: 'relative', padding: '24px 32px 32px 32px' }}>
          <button className="modal-close" onClick={onClose} id="modal-close">
            ✕
          </button>

          {/* Company Header */}
          <div className="company-header">
            <div className="company-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CompanyLogo company={displayedCompany} size={48} />
            </div>
            <div className="company-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2>{displayedCompany.name}</h2>
                {loadingCompany && (
                  <span style={{ fontSize: 10, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--brand-secondary)', padding: '2px 6px', borderRadius: 4 }}>
                    Loading Live Data...
                  </span>
                )}
                {!loadingCompany && liveCompany && (
                  <span style={{ fontSize: 10, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-emerald)', padding: '2px 6px', borderRadius: 4 }}>
                    ● Live Crustdata
                  </span>
                )}
              </div>
              <p>
                {displayedCompany.domain} · {displayedCompany.hq_location} · Founded {displayedCompany.founded_year}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="company-stats">
            <div className="company-stat">
              <div className="company-stat-value">{formatNumber(displayedHeadcount)}</div>
              <div className="company-stat-label">Headcount</div>
              <div className={`company-growth growth-${growth.direction}`}>
                {growth.direction === 'up' ? '↑' : growth.direction === 'down' ? '↓' : '–'}{' '}
                {growth.text}
              </div>
            </div>
            <div className="company-stat">
              <div className="company-stat-value">{formatCurrency(displayedFunding)}</div>
              <div className="company-stat-label">Funding</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {displayedCompany.funding_stage}
              </div>
            </div>
            <div className="company-stat">
              <div className="company-stat-value">{formatCurrency(displayedCompany.revenue_estimate_usd)}</div>
              <div className="company-stat-label">Est. Revenue</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {formatNumber(displayedCompany.web_traffic_monthly)} visits/mo
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="company-description">{displayedCompany.description}</p>

          {/* Tech Stack */}
          {displayedCompany.tech_stack && (
            <div className="company-tech-stack">
              {displayedCompany.tech_stack.map((tech) => (
                <span key={tech} className="tech-badge">{tech}</span>
              ))}
            </div>
          )}

          {/* Ratings */}
          <div style={{ display: 'flex', gap: 16, margin: '12px 0', fontSize: 12 }}>
            {displayedCompany.glassdoor_rating && (
              <span style={{ color: 'var(--text-secondary)' }}>
                Glassdoor: <strong style={{ color: 'var(--accent-amber)' }}>{displayedCompany.glassdoor_rating}</strong>
              </span>
            )}
            {displayedCompany.g2_rating && (
              <span style={{ color: 'var(--text-secondary)' }}>
                G2: <strong style={{ color: 'var(--accent-emerald)' }}>{displayedCompany.g2_rating}</strong>
              </span>
            )}
          </div>

          {/* AI Analysis of latest signal */}
          {companySignals.length > 0 && (
            <div className="company-ai-analysis">
              <h4>🧠 AI Analysis</h4>
              <p>{companySignals[0].ai_analysis}</p>
            </div>
          )}

          {/* Related Signals */}
          {companySignals.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Recent Signals ({companySignals.length})
              </div>
              {companySignals.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ marginRight: 8 }}>{s.icon}</span>
                  {s.title}
                </div>
              ))}
            </div>
          )}

          {/* Deep Dive Action */}
          <div style={{ marginTop: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
            {!deepDiveData && !loadingDeepDive && (
              <button
                onClick={handleDeepDive}
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                🧠 Generate AI Strategic Deep Dive →
              </button>
            )}

            {loadingDeepDive && (
              <div className="company-ai-analysis" style={{ textAlign: 'center', padding: '24px 0' }}>
                <div className="live-dot" style={{ margin: '0 auto 12px auto' }}></div>
                <p style={{ color: 'var(--brand-secondary)', fontWeight: 600 }}>Analyzing market data and indexing vectors...</p>
              </div>
            )}

            {errorDeepDive && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: 12,
                fontSize: '13px',
                color: 'var(--severity-critical)',
                lineHeight: '1.5'
              }}>
                <strong>⚠️ Competitive Intelligence Triage Offline</strong>
                <p style={{ marginTop: 4 }}>{errorDeepDive}</p>
              </div>
            )}

          {deepDiveData && (
            <div className="company-ai-analysis" style={{ marginTop: 16 }}>
              <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🧠 AI STRATEGIC DEEP DIVE</span>
                <span className={`signal-severity severity-${deepDiveData.threat_level || 'medium'}`} style={{ textTransform: 'uppercase' }}>
                  Threat: {deepDiveData.threat_level || 'medium'}
                </span>
              </h4>

              {/* SWOT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div style={{ background: 'rgba(52, 211, 153, 0.05)', padding: 10, borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 4 }}>STRENGTHS</div>
                  <ul style={{ paddingLeft: 12, margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
                    {deepDiveData.swot?.strengths?.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: 10, borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--severity-critical)', marginBottom: 4 }}>WEAKNESSES</div>
                  <ul style={{ paddingLeft: 12, margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
                    {deepDiveData.swot?.weaknesses?.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
                <div style={{ background: 'rgba(34, 211, 238, 0.05)', padding: 10, borderRadius: '6px', border: '1px solid rgba(34, 211, 238, 0.15)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 4 }}>OPPORTUNITIES</div>
                  <ul style={{ paddingLeft: 12, margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
                    {deepDiveData.swot?.opportunities?.map((o, idx) => <li key={idx}>{o}</li>)}
                  </ul>
                </div>
                <div style={{ background: 'rgba(251, 191, 36, 0.05)', padding: 10, borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 4 }}>THREATS</div>
                  <ul style={{ paddingLeft: 12, margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
                    {deepDiveData.swot?.threats?.map((t, idx) => <li key={idx}>{t}</li>)}
                  </ul>
                </div>
              </div>

              {/* Moat Analysis */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-secondary)', letterSpacing: 0.5 }}>MOAT ASSESSMENT</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  {deepDiveData.moat_analysis}
                </p>
              </div>

              {/* Attack Vectors */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-secondary)', letterSpacing: 0.5 }}>VULNERABILITIES & ATTACK VECTORS</div>
                <ul style={{ paddingLeft: 12, margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {deepDiveData.attack_vectors?.map((v, idx) => <li key={idx} style={{ padding: '2px 0' }}>{v}</li>)}
                </ul>
              </div>

              {/* AI Playbook */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', letterSpacing: 0.5 }}>AUTONOMOUS PLAYBOOK</div>
                <ul style={{ paddingLeft: 12, margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {deepDiveData.ai_playbook?.map((p, idx) => <li key={idx} style={{ padding: '2px 0', color: 'var(--accent-emerald)' }}>{p}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
