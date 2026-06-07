'use client';

import { useState, useMemo } from 'react';
import { timeAgo } from '@/lib/utils';

const SIGNAL_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'hiring_surge', label: '👥 Hiring' },
  { key: 'funding', label: '💰 Funding' },
  { key: 'exec_move', label: '👔 Exec' },
  { key: 'product_launch', label: '📦 Product' },
  { key: 'talent_flow', label: '🔄 Talent' },
  { key: 'press', label: '📰 Press' },
];

export default function SignalFeed({ signals, onSignalClick }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return signals;
    return signals.filter((s) => s.type === activeFilter);
  }, [signals, activeFilter]);

  return (
    <div className="double-bezel signal-feed" id="signal-feed">
      <div className="double-bezel-inner">
        <div className="section-header" style={{ padding: '8px 0 12px' }}>
          <div className="section-title">
            <span className="section-title-icon">📡</span>
            Signal Feed
          </div>
          <span className="section-badge">{filtered.length} signals</span>
        </div>

        <div className="signal-filters" style={{ padding: '0 0 12px' }}>
          {SIGNAL_TYPES.map((t) => (
            <button
              key={t.key}
              className={`filter-chip ${activeFilter === t.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(t.key)}
              id={`filter-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="signal-list" style={{ padding: 0 }}>
          {filtered.map((signal) => (
            <div
              key={`${signal.id}-${activeFilter}`}
              className="signal-item"
              onClick={() => onSignalClick(signal)}
              id={`signal-${signal.id}`}
            >
              <div
                className="signal-icon"
                style={{ background: `var(--severity-${signal.severity}-bg)` }}
              >
                {signal.icon}
              </div>
              <div className="signal-content">
                <div className="signal-title">{signal.title}</div>
                <div className="signal-meta">
                  <span className="signal-company">{signal.company_name}</span>
                  <span>·</span>
                  <span className={`signal-severity severity-${signal.severity}`}>
                    {signal.severity}
                  </span>
                  <span>·</span>
                  <span>{timeAgo(signal.timestamp)}</span>
                  <span>·</span>
                  <span>{signal.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
