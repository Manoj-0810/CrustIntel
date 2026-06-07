'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MetricsBar from './components/MetricsBar';
import MarketMap from './components/MarketMap';
import SignalFeed from './components/SignalFeed';
import IntelBrief from './components/IntelBrief';
import TalentFlow from './components/TalentFlow';
import CompanyModal from './components/CompanyModal';
import SearchModal from './components/SearchModal';
import SettingsPanel from './components/SettingsPanel';

import {
  TRACKED_COMPANY,
  COMPETITORS,
  SIGNALS,
  TALENT_FLOWS,
  INTEL_BRIEFS,
  MARKET_METRICS,
} from '@/lib/mock-data';

export default function WarRoom() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Live real-time state management for signals and metrics
  const [signalsList, setSignalsList] = useState(SIGNALS);
  const [metrics, setMetrics] = useState({
    companies_tracked: MARKET_METRICS.companies_tracked,
    signals_detected: MARKET_METRICS.signals_detected,
    signals_this_week: MARKET_METRICS.signals_this_week,
    threat_score: MARKET_METRICS.threat_score,
    briefs_generated: MARKET_METRICS.briefs_generated,
    talent_moves_tracked: MARKET_METRICS.talent_moves_tracked,
    last_refresh: Date.now()
  });

  // Simulated live monitoring engine: appends a new B2B competitive signal periodically
  useEffect(() => {
    const SIMULATED_SIGNALS = [
      {
        id: 'sim_sig_1',
        company_id: 'comp_001', // Apollo
        company_name: 'Apollo.io',
        type: 'product_launch',
        icon: '🚀',
        title: 'Apollo.io deploys Autonomous outbound agents',
        description: 'New feature launch detected in their direct outbound pipeline, incorporating LLM email personalization loops.',
        severity: 'high',
        ai_analysis: 'Direct competition to agentic workflows. Forces users to focus on real-time enrichment rather than static lists.'
      },
      {
        id: 'sim_sig_2',
        company_id: 'comp_002', // ZoomInfo
        company_name: 'ZoomInfo',
        type: 'talent_layoff',
        icon: '👥',
        title: 'ZoomInfo Engineering Director departs entity',
        description: 'Director of GTM database pipelines departs. Headcount index indicates persistent structural consolidations.',
        severity: 'medium',
        ai_analysis: 'Creates immediate recruiting opportunities for scaling data infrastructure layers.'
      },
      {
        id: 'sim_sig_3',
        company_id: 'comp_003', // Lusha
        company_name: 'Lusha',
        type: 'funding_round',
        icon: '💰',
        title: 'Lusha extends Series B funding by $18M',
        description: 'Additional capital secured to expand API-first web enrichment scrapers.',
        severity: 'medium',
        ai_analysis: 'Signals direct market validation of automated API-first lead discovery and crawler indexes.'
      },
      {
        id: 'sim_sig_4',
        company_id: 'comp_004', // Coresignal
        company_name: 'Coresignal',
        type: 'hiring_surge',
        icon: '📈',
        title: 'Coresignal lists 8 new database indexing open roles',
        description: 'Hiring surge detected in crawler engineering division to scale data delivery pipelines.',
        severity: 'low',
        ai_analysis: 'Indicates efforts to minimize indexing latency and support real-time data feeds.'
      }
    ];

    let index = 0;
    const interval = setInterval(() => {
      const template = SIMULATED_SIGNALS[index];
      const newSignal = {
        ...template,
        id: `sim_sig_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      setSignalsList((prev) => [newSignal, ...prev]);
      setMetrics((prev) => ({
        ...prev,
        signals_detected: prev.signals_detected + 1,
        signals_this_week: prev.signals_this_week + 1,
        last_refresh: Date.now()
      }));

      index = (index + 1) % SIMULATED_SIGNALS.length;
    }, 45000); // Trigger a new signal event every 45 seconds

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSettingsOpen(false);
        setSelectedCompany(null);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleCompanyClick = useCallback((company) => {
    setSelectedCompany(company);
  }, []);

  const handleSignalClick = useCallback((signal) => {
    const company =
      COMPETITORS.find((c) => c.id === signal.company_id) ||
      (TRACKED_COMPANY.id === signal.company_id ? TRACKED_COMPANY : null);
    if (company) setSelectedCompany(company);
  }, []);

  const handleSWOTGenerated = (threatLevel) => {
    setMetrics((prev) => {
      let scoreDiff = 0.0;
      if (threatLevel === 'critical') scoreDiff = 0.2;
      else if (threatLevel === 'high') scoreDiff = 0.1;
      else if (threatLevel === 'low') scoreDiff = -0.1;
      
      const newScore = parseFloat(Math.min(10.0, Math.max(1.0, prev.threat_score + scoreDiff)).toFixed(1));
      return {
        ...prev,
        briefs_generated: prev.briefs_generated + 1,
        threat_score: newScore,
        last_refresh: Date.now()
      };
    });
  };

  const handleTalentAnalyzed = (movesCount) => {
    setMetrics((prev) => ({
      ...prev,
      talent_moves_tracked: prev.talent_moves_tracked + movesCount,
      briefs_generated: prev.briefs_generated + 1,
      last_refresh: Date.now()
    }));
  };

  const allCompanies = [TRACKED_COMPANY, ...COMPETITORS];

  return (
    <>
      <Header
        metrics={metrics}
        onSearchOpen={() => setSearchOpen(true)}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      <MetricsBar metrics={metrics} />

      <div className="dashboard">
        {/* Left column */}
        <div className="dashboard-main">
          <MarketMap
            selfCompany={TRACKED_COMPANY}
            competitors={COMPETITORS}
            onCompanyClick={handleCompanyClick}
          />
          <SignalFeed
            signals={signalsList}
            onSignalClick={handleSignalClick}
          />
        </div>

        {/* Right column */}
        <div className="dashboard-sidebar">
          <IntelBrief briefs={INTEL_BRIEFS} />
          <TalentFlow flows={TALENT_FLOWS} onTalentAnalyzed={handleTalentAnalyzed} />
        </div>
      </div>

      {selectedCompany && (
        <CompanyModal
          company={selectedCompany}
          signals={signalsList}
          onClose={() => setSelectedCompany(null)}
          onSWOTGenerated={handleSWOTGenerated}
        />
      )}

      {searchOpen && (
        <SearchModal
          companies={allCompanies}
          onSelect={handleCompanyClick}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
