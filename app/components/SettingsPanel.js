'use client';

import { useState, useEffect } from 'react';

export default function SettingsPanel({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [crustKey, setCrustKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('crustintel_claude_key');
      if (saved) setApiKey(saved);
      const crust = localStorage.getItem('crustintel_crust_key');
      if (crust) setCrustKey(crust);
    } catch {}
  }, []);

  useEffect(() => {
    const orig = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, []);

  const handleSave = () => {
    try {
      if (apiKey.trim()) localStorage.setItem('crustintel_claude_key', apiKey.trim());
      else localStorage.removeItem('crustintel_claude_key');
      if (crustKey.trim()) localStorage.setItem('crustintel_crust_key', crustKey.trim());
      else localStorage.removeItem('crustintel_crust_key');
      setSaved(true);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('crustintel:keys-saved'));
      setTimeout(() => { setSaved(false); onClose(); }, 900);
    } catch (e) { console.error('Failed to save', e); }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      setTestResult(res.ok ? 'ok' : 'error');
    } catch { setTestResult('error'); }
    finally { setTesting(false); }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="double-bezel settings-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '12px' }}
      >
        <div className="double-bezel-inner" style={{ padding: '28px 32px' }}>
          <div className="settings-header" style={{ margin: 0, marginBottom: '24px' }}>
            <div>
              <div className="settings-title">⚙ API Keys</div>
              <div className="settings-subtitle">
                Keys are stored only in your browser — never sent to any server.
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {/* Claude Key */}
          <div className="settings-section">
            <label className="settings-label">
              Claude API Key (Anthropic)
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="settings-help-link"
              >
                Get free key ↗
              </a>
            </label>
            <div className="claude-key-badge">
              <span className="claude-badge-inner">✦ claude sonnet 4 — required for AI analysis</span>
            </div>
            <div className="api-key-row" style={{ marginTop: 10 }}>
              <input
                type="password"
                className="api-key-input"
                placeholder="sk-ant-api03-…"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
                autoComplete="off"
              />
              <button
                className={`test-btn${testing ? ' testing' : ''}${testResult === 'ok' ? ' test-ok' : ''}${testResult === 'error' ? ' test-error' : ''}`}
                onClick={handleTest}
                disabled={!apiKey.trim() || testing}
              >
                {testing ? '…' : testResult === 'ok' ? '✓ Valid' : testResult === 'error' ? '✗ Invalid' : 'Test'}
              </button>
            </div>
            {testResult === 'ok' && (
              <div className="settings-feedback ok">✓ Claude is connected — AI analysis is live.</div>
            )}
            {testResult === 'error' && (
              <div className="settings-feedback error">✗ Invalid key. Check console.anthropic.com and try again.</div>
            )}
          </div>

          {/* Crustdata Key */}
          <div className="settings-section">
            <label className="settings-label">
              Crustdata API Key
              <a
                href="https://crustdata.com"
                target="_blank"
                rel="noopener noreferrer"
                className="settings-help-link"
              >
                Get key ↗
              </a>
            </label>
            <input
              type="password"
              className="api-key-input"
              style={{ width: '100%' }}
              placeholder="crustdata_live_…"
              value={crustKey}
              onChange={(e) => setCrustKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="settings-note">
            <strong>No keys?</strong> The app runs on rich mock data with zero setup.
            Add your Claude key to unlock live AI signal analysis, agentic deep dives, and intelligence briefs.
          </div>

          <div className="settings-footer">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className={`btn-primary${saved ? ' btn-saved' : ''}`}
              onClick={handleSave}
              disabled={saved}
            >
              {saved ? '✓ Saved!' : 'Save & Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
