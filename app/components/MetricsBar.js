'use client';

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';

export default function MetricsBar({ metrics }) {
  const [freshnessText, setFreshnessText] = useState('Just now');

  useEffect(() => {
    const updateFreshness = () => {
      const base = metrics.last_refresh || Date.now();
      const diff = Math.floor((Date.now() - base) / 1000);
      if (diff < 15) {
        setFreshnessText('Just now');
      } else if (diff < 60) {
        setFreshnessText(`${diff}s ago`);
      } else {
        const mins = Math.floor(diff / 60);
        setFreshnessText(`${mins} min${mins > 1 ? 's' : ''} ago`);
      }
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 5000);
    return () => clearInterval(interval);
  }, [metrics.last_refresh]);

  const items = [
    { key: 'companies_tracked', label: 'Companies Tracked', value: metrics.companies_tracked },
    { key: 'signals_detected', label: 'Signals Detected', value: metrics.signals_detected },
    { key: 'signals_this_week', label: 'This Week', value: metrics.signals_this_week },
    { key: 'threat_score', label: 'Threat Score', value: metrics.threat_score, isThreat: true },
    { key: 'briefs_generated', label: 'Briefs Generated', value: metrics.briefs_generated },
    { key: 'talent_moves', label: 'Talent Moves', value: metrics.talent_moves_tracked },
    { key: 'freshness', label: 'Data Freshness', value: freshnessText, isText: true },
  ];

  return (
    <div className="metrics-bar">
      {items.map((item, i) => (
        <div
          key={item.key}
          className={`double-bezel metric-card animate-in stagger-${i + 1}`}
          id={`metric-${item.key}`}
          style={{ padding: '8px' }}
        >
          <div className="double-bezel-inner" style={{ padding: '12px 16px', alignItems: 'center', justifyContent: 'center' }}>
            <div className={`metric-value ${item.isThreat ? 'threat' : ''}`}>
              {item.isText ? item.value : <CountUp target={item.value} />}
            </div>
            <div className="metric-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CountUp({ target }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const isFloat = !Number.isInteger(target);
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setCurrent(target);
        clearInterval(timer);
      } else {
        setCurrent(isFloat ? parseFloat((increment * step).toFixed(1)) : Math.round(increment * step));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return <>{typeof current === 'number' && current % 1 !== 0 ? current.toFixed(1) : current}</>;
}
