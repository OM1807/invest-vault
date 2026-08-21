type BadgeKind =
  | 'draft' | 'published' | 'archived'
  | 'open' | 'closed' | 'funded'
  | 'pending' | 'accepted' | 'rejected';

const styles: Record<BadgeKind, string> = {
  draft: 'bg-slate-700/40 text-slate-300',
  published: 'bg-accent-500/15 text-accent-400',
  archived: 'bg-slate-800/40 text-slate-500',
  open: 'bg-emerald-500/15 text-emerald-400',
  closed: 'bg-slate-700/40 text-slate-400',
  funded: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/15 text-amber-400',
  accepted: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-rose-500/15 text-rose-400',
};

export default function StatusBadge({ status }: { status: BadgeKind }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
