'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { getThreatColor } from '@/lib/utils';

// Helper component for realistic logo
const CompanyLogo = ({ company, size = 28 }) => {
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
        borderRadius: '50%',
        background: '#fff',
        padding: '1px',
      }}
      onError={() => setError(true)}
    />
  );
};

export default function MarketMap({ selfCompany, competitors, onCompanyClick }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const viewportRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistRef = useRef(null);

  // Position nodes in concentric orbits based on threat level
  const nodes = useMemo(() => {
    const centerX = 50; // percent
    const centerY = 50;

    // Self node at center
    const self = {
      ...selfCompany,
      x: centerX,
      y: centerY,
      isSelf: true,
    };

    // Orbit radii by threat level
    const orbits = { high: 22, medium: 34, low: 44 };
    const grouped = { high: [], medium: [], low: [] };

    competitors.forEach((c) => {
      const level = c.threat_level === 'critical' ? 'high' : c.threat_level;
      if (grouped[level]) grouped[level].push(c);
      else grouped.medium.push(c);
    });

    const positioned = [];
    Object.entries(grouped).forEach(([level, companies]) => {
      const radius = orbits[level] || 34;
      companies.forEach((c, i) => {
        const angle = (2 * Math.PI * i) / companies.length - Math.PI / 2;
        positioned.push({
          ...c,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          isSelf: false,
        });
      });
    });

    return [self, ...positioned];
  }, [selfCompany, competitors]);

  // Non-passive wheel listener for smooth zoom tracking
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 1.12;
      setZoom((z) => {
        const nextZoom = e.deltaY < 0 ? z * zoomFactor : z / zoomFactor;
        return Math.max(0.6, Math.min(3.0, nextZoom));
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch gesture handlers (drag panning & pinch zoom)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
    } else if (e.touches.length === 2) {
      setIsDragging(false); // Disable panning during pinch
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y
      });
    } else if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / lastTouchDistRef.current;
      setZoom((z) => Math.max(0.6, Math.min(3.0, z * factor)));
      lastTouchDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistRef.current = null;
  };

  // Button actions
  const zoomIn = () => setZoom((z) => Math.min(3.0, z * 1.25));
  const zoomOut = () => setZoom((z) => Math.max(0.6, z / 1.25));
  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="double-bezel market-map" id="market-map">
      <div className="double-bezel-inner">
        <div className="section-header">
          <div className="section-title">
            <span className="section-title-icon">🎯</span>
            Market Map
          </div>
          <span className="section-badge">{competitors.length} tracked</span>
        </div>

        <div
          ref={viewportRef}
          className="map-viewport"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            width: '100%',
            height: '380px',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-deep)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Zoomable Container */}
          <div
            className="map-zoom-content"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Grid dot matrix background */}
            <div className="map-grid-bg" />

            {/* Orbit rings */}
            <div className="orbit-ring orbit-ring-1" />
            <div className="orbit-ring orbit-ring-2" />
            <div className="orbit-ring orbit-ring-3" />

            {/* Connection lines (SVG) */}
            <svg className="map-connection" viewBox="0 0 100 100" preserveAspectRatio="none">
              {nodes.slice(1).map((node) => (
                <line
                  key={`line-${node.id}`}
                  x1={`${nodes[0].x}%`}
                  y1={`${nodes[0].y}%`}
                  x2={`${node.x}%`}
                  y2={`${node.y}%`}
                  stroke={getThreatColor(node.threat_level)}
                  strokeWidth="0.15"
                  strokeOpacity="0.35"
                  strokeDasharray="1,1"
                />
              ))}
            </svg>

            {/* Company nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`map-node ${node.isSelf ? 'map-node-self' : ''}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onClick={() => onCompanyClick(node)}
                title={node.name}
                id={`map-node-${node.id}`}
              >
                <div
                  className="map-node-dot"
                  style={{ borderColor: getThreatColor(node.threat_level) }}
                >
                  <CompanyLogo company={node} size={node.isSelf ? 36 : 28} />
                </div>
                <span className="map-node-label">{node.name}</span>
              </div>
            ))}
          </div>

          {/* Floating UI Navigation controls */}
          <div className="map-controls">
            <button className="map-control-btn" onClick={zoomIn} title="Zoom In">+</button>
            <button className="map-control-btn" onClick={zoomOut} title="Zoom Out">-</button>
            <button className="map-control-btn reset-btn" onClick={resetMap} title="Reset view">⟲</button>
          </div>
        </div>
      </div>
    </div>
  );
}
