'use client';

import { useState, useEffect } from 'react';

export default function Header({ metrics, onSearchOpen, onSettingsOpen }) {
  const [hasClaudeKey, setHasClaudeKey] = useState(false);
  const [hasCrustKey, setHasCrustKey] = useState(false);

  const checkKeys = () => {
    try {
      const claude = localStorage.getItem('crustintel_claude_key');
      const crust = localStorage.getItem('crustintel_crust_key');
      setHasClaudeKey(!!claude);
      setHasCrustKey(!!crust);
    } catch {}
  };

  useEffect(() => {
    checkKeys();
  }, []);

  // Re-check when settings may have been updated
  useEffect(() => {
    window.addEventListener('storage', checkKeys);
    window.addEventListener('focus', checkKeys);
    window.addEventListener('crustintel:keys-saved', checkKeys);
    return () => {
      window.removeEventListener('storage', checkKeys);
      window.removeEventListener('focus', checkKeys);
      window.removeEventListener('crustintel:keys-saved', checkKeys);
    };
  }, []);

  let badgeText = 'Demo Mode';
  let badgeClass = 'ai-badge-demo';

  if (hasClaudeKey && hasCrustKey) {
    badgeText = 'Claude + Crustdata Active';
    badgeClass = 'ai-badge-live';
  } else if (hasClaudeKey) {
    badgeText = 'Claude Active (Demo Data)';
    badgeClass = 'ai-badge-live';
  } else if (hasCrustKey) {
    badgeText = 'Crustdata Active (Claude Offline)';
    badgeClass = 'ai-badge-partial';
  }

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-logo">🦀</span>
        <div>
          <div className="header-title">CrustIntel</div>
          <div className="header-subtitle">AI Competitive War Room</div>
        </div>
      </div>

      <div className="header-status">
        <div className="live-indicator">
          <span className="live-dot" />
          Live Monitoring
        </div>

        <div className={`ai-active-badge ${badgeClass}`}>
          <span className="status-dot" />
          {badgeText}
        </div>

        <button
          className="header-search-btn"
          onClick={onSearchOpen}
          id="search-trigger"
        >
          🔍 Search companies…
          <kbd>⌘K</kbd>
        </button>

        <button
          className="settings-trigger"
          onClick={onSettingsOpen}
          title="API Settings"
          id="settings-trigger"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
