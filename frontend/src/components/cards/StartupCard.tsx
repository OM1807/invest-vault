import { Link } from 'react-router-dom';
import type { Startup } from '@/lib/types';
import { formatCompactCurrency, formatPercent } from '@/lib/format';
import StatusBadge from '@/components/ui/StatusBadge';

interface StartupCardProps {
  startup: Startup;
  showEdit?: boolean;
  onEdit?: () => void;
}

export default function StartupCard({ startup, showEdit, onEdit }: StartupCardProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="mb-1">
            <StatusBadge status={startup.status} />
          </div>
          <h3 className="text-sm font-semibold text-white truncate">{startup.name}</h3>
          {startup.tagline && <p className="text-xs text-slate-400 truncate">{startup.tagline}</p>}
        </div>
      </div>

      {startup.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{startup.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-md bg-ink-800 px-2.5 py-1.5">
          <div className="text-xs text-slate-500">Target</div>
          <div className="text-sm font-medium text-white">{formatCompactCurrency(startup.target_amount)}</div>
        </div>
        <div className="rounded-md bg-ink-800 px-2.5 py-1.5">
          <div className="text-xs text-slate-500">Equity</div>
          <div className="text-sm font-medium text-white">{formatPercent(startup.equity_offered)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
        <span className="rounded-md bg-white/5 px-2 py-0.5">{startup.sector || '—'}</span>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        <Link
          to={`/startups/${startup.id}`}
          className="flex-1 text-center rounded-md bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
        >
          View
        </Link>
        {showEdit && onEdit && (
          <button onClick={onEdit} className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5">
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
