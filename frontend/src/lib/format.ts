export function formatCurrency(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '$0';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  });
}

export function formatCompactCurrency(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function formatPercent(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '0%';
  return `${n.toFixed(1)}%`;
}

export function formatDate(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = now - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function initials(first: string, last: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}
