/**
 * Formats a date string into a friendly, human relative time
 * e.g., "in 3 minutes", "in 2 hours", "yesterday", "in 2 days"
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHours = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSec) < 60) {
    if (diffSec > 0) return `in ${diffSec}s`;
    return `${Math.abs(diffSec)}s ago`;
  }

  if (Math.abs(diffMin) < 60) {
    if (diffMin > 0) return `in ${diffMin}m`;
    return `${Math.abs(diffMin)}m ago`;
  }

  if (Math.abs(diffHours) < 24) {
    if (diffHours > 0) return `in ${diffHours}h`;
    return `${Math.abs(diffHours)}h ago`;
  }

  if (Math.abs(diffDays) < 30) {
    if (diffDays > 0) return `in ${diffDays}d`;
    return `${Math.abs(diffDays)}d ago`;
  }

  return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats an exact date with local time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}
