import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import StartupCard from '@/components/cards/StartupCard';
import InvestorProfileForm from '@/components/forms/InvestorProfileForm';
import { bidsApi, investorsApi, startupsApi } from '@/lib/api';
import type { Bid, InvestorProfile, Startup, InvestorProfilePayload } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatPercent, formatDate } from '@/lib/format';

const SECTORS = ['All', 'SaaS', 'Fintech', 'Healthtech', 'AI/ML', 'Climate', 'Consumer', 'Web3', 'DevTools', 'Marketplace', 'Hardware', 'EdTech', 'Other'];

export default function InvestorDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'browse';

  const [startups, setStartups] = useState<Startup[]>([]);
  const [filtered, setFiltered] = useState<Startup[]>([]);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [profileModal, setProfileModal] = useState(false);

  const setTab = (t: string) => setSearchParams(t === 'browse' ? {} : { tab: t });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [startupList, profileList, bidList] = await Promise.all([startupsApi.list(), investorsApi.list(), bidsApi.list()]);
      setStartups(startupList.filter((s) => s.status === 'published'));
      setProfile(profileList.find((p) => p.user === user?.id) ?? null);
      setMyBids(bidList);
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let result = startups;
    if (sector !== 'All') result = result.filter((s) => s.sector === sector);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [startups, sector, search]);

  const handleProfileSubmit = async (payload: InvestorProfilePayload) => {
    if (profile) setProfile(await investorsApi.update(profile.id, payload));
    else setProfile(await investorsApi.create(payload));
  };

  const pendingCount = myBids.filter((b) => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Discover startups and track your bids.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setProfileModal(true)}>Profile</Button>
        </div>

        <div className="flex items-center gap-1 mb-5 border-b border-white/10">
          <button onClick={() => setTab('browse')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'browse' ? 'text-white border-accent-500' : 'text-slate-400 border-transparent'}`}>
            Browse
          </button>
          <button onClick={() => setTab('bids')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'bids' ? 'text-white border-accent-500' : 'text-slate-400 border-transparent'}`}>
            My Bids{pendingCount > 0 && ` (${pendingCount})`}
          </button>
        </div>

        {!profile && (
          <div className="glass-card p-4 mb-5 border-amber-500/20 flex items-center justify-between">
            <p className="text-sm text-slate-300">Complete your investor profile so founders know who you are.</p>
            <Button size="sm" onClick={() => setProfileModal(true)}>Set up</Button>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : tab === 'browse' ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input className="input-base flex-1" placeholder="Search startups..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="input-base sm:w-48" value={sector} onChange={(e) => setSector(e.target.value)}>
                {SECTORS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All sectors' : s}</option>)}
              </select>
            </div>
            {filtered.length === 0 ? (
              <EmptyState title="No startups found" description={search || sector !== 'All' ? 'Try adjusting your filters.' : 'No published startups yet.'} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((s) => <StartupCard key={s.id} startup={s} />)}
              </div>
            )}
          </>
        ) : (
          myBids.length === 0 ? (
            <EmptyState title="No bids placed" description="Browse startups and place a bid on an open round." action={<Link to="/dashboard"><Button onClick={() => setTab('browse')}>Browse startups</Button></Link>} />
          ) : (
            <div className="space-y-2">
              {[...myBids].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((b) => (
                <Link key={b.id} to={`/startups?round=${b.funding_round}`} className="block glass-card p-3 hover:border-accent-500/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{b.funding_round_name}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{formatCurrency(b.amount)} · {formatPercent(b.equity_requested)}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{formatDate(b.created_at)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>

      <InvestorProfileForm open={profileModal} onClose={() => setProfileModal(false)} onSubmit={handleProfileSubmit} profile={profile} />
    </div>
  );
}
