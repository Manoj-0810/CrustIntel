import { useState, useEffect, useRef, useMemo } from 'react';

// Helper component for realistic logo
const CompanyLogo = ({ company, size = 24 }) => {
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
        borderRadius: '4px',
        background: '#fff',
        padding: '1px',
        border: '1px solid var(--border-default)',
      }}
      onError={() => setError(true)}
    />
  );
};

export default function SearchModal({ companies, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const [crustKey, setCrustKey] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState(null);

  useEffect(() => {
    try {
      const key = localStorage.getItem('crustintel_crust_key');
      if (key && key.trim().length > 10) {
        setCrustKey(key.trim());
      }
    } catch {}
  }, []);

  const handleLiveSearch = async () => {
    if (!query.trim() || !crustKey) return;
    setLoadingLive(true);
    setLiveError(null);
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: query, crustKey })
      });
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Company "${query}" not found in Crustdata.`);
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Live search failed');
      }
      const data = await res.json();
      if (data.company) {
        onSelect(data.company);
        onClose();
      } else {
        throw new Error(`Company "${query}" not found in Crustdata.`);
      }
    } catch (err) {
      setLiveError(err.message);
    } finally {
      setLoadingLive(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (results.length === 0 && crustKey && query.trim()) {
        e.preventDefault();
        handleLiveSearch();
      }
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll on mount
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return companies;
    const q = query.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
    );
  }, [query, companies]);

  return (
    <div
      className="modal-overlay search-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      id="search-modal"
    >
      <div
        className="double-bezel modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '12px' }}
      >
        <div className="double-bezel-inner" style={{ padding: 0 }}>
          <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search companies, domains, industries…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            id="search-input"
          />
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border-default)',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ESC
          </button>
        </div>

        <div className="search-results">
          {results.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: crustKey && query.trim() ? 16 : 0 }}>
                No local companies found for "{query}"
              </div>
              {crustKey && query.trim() && (
                <div style={{ 
                  background: 'rgba(99, 102, 241, 0.05)', 
                  border: '1px solid var(--border-default)', 
                  borderRadius: '8px', 
                  padding: '16px',
                  display: 'inline-block',
                  maxWidth: '100%',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    Search for "<strong>{query}</strong>" live on Crustdata?
                  </p>
                  <button
                    onClick={handleLiveSearch}
                    className="btn-primary"
                    disabled={loadingLive}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                  >
                    {loadingLive ? '🔍 Searching Crustdata...' : '🔍 Search Live Crustdata'}
                  </button>
                  {liveError && (
                    <p style={{ color: 'var(--severity-critical)', fontSize: 11, marginTop: 8, maxWidth: 300, marginInline: 'auto' }}>
                      ⚠️ {liveError}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            results.map((company) => (
              <div
                key={company.id}
                className="search-result-item"
                onClick={() => {
                  onSelect(company);
                  onClose();
                }}
                id={`search-result-${company.id}`}
              >
                <div className="search-result-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CompanyLogo company={company} size={24} />
                </div>
                <div className="search-result-info">
                  <h4>{company.name}</h4>
                  <p>{company.domain} · {company.industry}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
