import { useCallback, useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import StartupCard from '@/components/cards/StartupCard';
import StartupFormModal from '@/components/forms/StartupFormModal';
import RoundFormModal from '@/components/forms/RoundFormModal';
import FounderProfileForm from '@/components/forms/FounderProfileForm';
import { bidsApi, foundersApi, roundsApi, startupsApi } from '@/lib/api';
import type {
  Bid, FounderProfile, FundingRound, Startup,
  StartupPayload, FundingRoundPayload, FounderProfilePayload,
} from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

export default function FounderDashboard() {
  const { user } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [rounds, setRounds] = useState<Record<number, FundingRound[]>>({});
  const [bids, setBids] = useState<Record<number, Bid[]>>({});
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [startupModal, setStartupModal] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);
  const [roundModal, setRoundModal] = useState(false);
  const [editingRound, setEditingRound] = useState<FundingRound | null>(null);
  const [roundStartupId, setRoundStartupId] = useState<number | null>(null);
  const [profileModal, setProfileModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [startupList, profileList] = await Promise.all([startupsApi.list(), foundersApi.list()]);
      setStartups(startupList);
      setProfile(profileList.find((p) => p.user === user?.id) ?? null);

      const roundMap: Record<number, FundingRound[]> = {};
      const bidMap: Record<number, Bid[]> = {};
      for (const s of startupList) {
        try {
          const rs = await roundsApi.list({ startup: s.id });
          roundMap[s.id] = rs;
          for (const r of rs) {
            bidMap[r.id] = await bidsApi.list({ funding_round: r.id });
          }
        } catch { roundMap[s.id] = []; }
      }
      setRounds(roundMap);
      setBids(bidMap);
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStartupSubmit = async (payload: StartupPayload) => {
    if (editingStartup) await startupsApi.update(editingStartup.id, payload);
    else await startupsApi.create(payload);
    await loadData();
  };

  const handleRoundSubmit = async (payload: FundingRoundPayload) => {
    if (editingRound) await roundsApi.update(editingRound.id, payload);
    else await roundsApi.create(payload);
    await loadData();
  };

  const handleProfileSubmit = async (payload: FounderProfilePayload) => {
    if (profile) setProfile(await foundersApi.update(profile.id, payload));
    else setProfile(await foundersApi.create(payload));
  };

  const handleBidAction = async (bid: Bid, action: 'accepted' | 'rejected') => {
    setActionLoading(bid.id);
    try {
      await bidsApi.update(bid.id, { status: action } as any);
      await loadData();
    } finally { setActionLoading(null); }
  };

  const handleDeleteStartup = async (id: number) => {
    if (!confirm('Delete this startup? This cannot be undone.')) return;
    await startupsApi.remove(id);
    await loadData();
  };

  const openRoundModal = (startupId: number, round?: FundingRound) => {
    setRoundStartupId(startupId);
    setEditingRound(round ?? null);
    setRoundModal(true);
  };

  const openEditStartup = (s: Startup) => { setEditingStartup(s); setStartupModal(true); };
  const openCreateStartup = () => { setEditingStartup(null); setStartupModal(true); };

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">My Startups</h1>
            <p className="text-sm text-slate-400 mt-0.5">Welcome back, {user?.first_name}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setProfileModal(true)}>Profile</Button>
            <Button size="sm" onClick={openCreateStartup}>New startup</Button>
          </div>
        </div>

        {!profile && (
          <div className="glass-card p-4 mb-5 border-amber-500/20 flex items-center justify-between">
            <p className="text-sm text-slate-300">Complete your founder profile to attract investors.</p>
            <Button size="sm" onClick={() => setProfileModal(true)}>Set up</Button>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : startups.length === 0 ? (
          <EmptyState
            title="No startups yet"
            description="Create your first startup to start raising capital."
            action={<Button onClick={openCreateStartup}>Create startup</Button>}
          />
        ) : (
          <div className="space-y-3">
            {startups.map((s) => {
              const rs = rounds[s.id] ?? [];
              const isExpanded = expandedId === s.id;
              return (
                <div key={s.id} className="glass-card overflow-hidden">
                  <div className="p-4 flex flex-col lg:flex-row gap-3">
                    <div className="flex-1 min-w-0">
                      <StartupCard startup={s} showEdit onEdit={() => openEditStartup(s)} />
                    </div>
                    <div className="flex lg:flex-col gap-2 lg:w-32">
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleDeleteStartup(s.id)}>Delete</Button>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 border-t border-white/10 text-sm text-slate-300 hover:bg-white/5"
                  >
                    <span>Funding rounds ({rs.length})</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); openRoundModal(s.id); }}
                      className="text-accent-400 hover:text-accent-300"
                    >
                      + Add round
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {rs.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-sm text-slate-500 mb-3">No funding rounds yet.</p>
                          <Button size="sm" onClick={() => openRoundModal(s.id)}>Open a round</Button>
                        </div>
                      ) : (
                        <div className="space-y-3 mt-3">
                          {rs.map((r) => {
                            const roundBids = bids[r.id] ?? [];
                            return (
                              <div key={r.id} className="rounded-lg border border-white/10 bg-ink-800 overflow-hidden">
                                <div className="p-3 flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-white">{r.name}</span>
                                      <StatusBadge status={r.status} />
                                    </div>
                                    {r.description && <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="text-slate-500">Target: <span className="text-white font-medium">{formatCurrency(r.target_amount)}</span></span>
                                    <span className="text-slate-500">Tickets: <span className="text-white font-medium">{formatCurrency(r.minimum_ticket_size)}–{formatCurrency(r.maximum_ticket_size)}</span></span>
                                    <button onClick={() => openRoundModal(s.id, r)} className="text-slate-400 hover:text-white">Edit</button>
                                  </div>
                                </div>

                                {roundBids.length > 0 && (
                                  <div className="border-t border-white/10">
                                    <div className="px-3 py-1.5 bg-ink-850 text-xs text-slate-400">Bids ({roundBids.length})</div>
                                    <div className="divide-y divide-white/10">
                                      {roundBids.map((b) => (
                                        <div key={b.id} className="px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm text-white">{b.investor_name}</span>
                                              <StatusBadge status={b.status} />
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                              {formatCurrency(b.amount)} · {formatPercent(b.equity_requested)}
                                              {b.message && ` · "${b.message}"`}
                                            </div>
                                          </div>
                                          {b.status === 'pending' && (
                                            <div className="flex items-center gap-1.5">
                                              <Button size="sm" className="!py-1 !px-2.5" loading={actionLoading === b.id} onClick={() => handleBidAction(b, 'accepted')}>Accept</Button>
                                              <Button variant="danger" size="sm" className="!py-1 !px-2.5" loading={actionLoading === b.id} onClick={() => handleBidAction(b, 'rejected')}>Reject</Button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StartupFormModal open={startupModal} onClose={() => setStartupModal(false)} onSubmit={handleStartupSubmit} startup={editingStartup} />
      <RoundFormModal open={roundModal} onClose={() => setRoundModal(false)} onSubmit={handleRoundSubmit} startupId={roundStartupId ?? 0} round={editingRound} />
      <FounderProfileForm open={profileModal} onClose={() => setProfileModal(false)} onSubmit={handleProfileSubmit} profile={profile} />
    </div>
  );
}
