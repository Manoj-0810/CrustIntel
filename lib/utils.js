// ============================================================
// CrustIntel — Utility Functions
// ============================================================

/**
 * Format a number with K/M/B suffixes
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Format a number as currency with K/M/B suffixes
 * @param {number} num
 * @returns {string}
 */
export function formatCurrency(num) {
  if (num === null || num === undefined) return '—';
  return '$' + formatNumber(num);
}

/**
 * Convert ISO date to relative time string
 * @param {string} isoDate
 * @returns {string}
 */
export function timeAgo(isoDate) {
  if (!isoDate) return '';
  const seconds = Math.floor((new Date() - new Date(isoDate)) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
  if (seconds < 2592000) return Math.floor(seconds / 604800) + 'w ago';
  return Math.floor(seconds / 2592000) + 'mo ago';
}

/**
 * Get CSS color for severity level
 * @param {'critical'|'high'|'medium'|'low'} severity
 * @returns {string}
 */
export function getSeverityColor(severity) {
  const colors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e'
  };
  return colors[severity] || '#64748b';
}

/**
 * Get emoji icon for signal type
 * @param {string} type
 * @returns {string}
 */
export function getSignalIcon(type) {
  const icons = {
    funding: '💰',
    hiring_surge: '👥',
    exec_move: '👔',
    product_launch: '📦',
    press: '📰',
    talent_flow: '🔄',
    job_posting: '💼'
  };
  return icons[type] || '📡';
}

/**
 * Get CSS color for threat level
 * @param {string} level
 * @returns {string}
 */
export function getThreatColor(level) {
  const colors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    self: '#818cf8'
  };
  return colors[level] || '#64748b';
}

/**
 * Calculate composite threat score from signals
 * @param {Array} signals
 * @returns {number}
 */
export function calculateThreatScore(signals) {
  if (!signals || signals.length === 0) return 0;
  const weights = { critical: 10, high: 7, medium: 4, low: 1 };
  const total = signals.reduce((sum, s) => sum + (weights[s.severity] || 0), 0);
  const maxPossible = signals.length * 10;
  return Math.round((total / maxPossible) * 10 * 10) / 10;
}

/**
 * Get human-readable label for signal type
 * @param {string} type
 * @returns {string}
 */
export function getSignalLabel(type) {
  const labels = {
    funding: 'Funding',
    hiring_surge: 'Hiring',
    exec_move: 'Executive',
    product_launch: 'Product',
    press: 'Press',
    talent_flow: 'Talent',
    job_posting: 'Jobs'
  };
  return labels[type] || type;
}

/**
 * Format growth percentage with arrow
 * @param {number} growth
 * @returns {{ text: string, direction: 'up'|'down'|'stable' }}
 */
export function formatGrowth(growth) {
  if (growth > 0) return { text: `+${growth.toFixed(1)}%`, direction: 'up' };
  if (growth < 0) return { text: `${growth.toFixed(1)}%`, direction: 'down' };
  return { text: '0%', direction: 'stable' };
}
