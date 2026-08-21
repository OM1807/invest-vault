import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Presentation,
  Mail,
  MapPin,
  Rocket,
  TrendingUp,
  Wallet,
  Lock,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import BidFormModal from '@/components/forms/BidFormModal';
import { bidsApi, foundersApi, roundsApi, startupsApi } from '@/lib/api';
import type { BidPayload, FounderProfile, FundingRound, Startup } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatPercent, formatDate } from '@/lib/format';

export default function StartupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [rounds, setRounds] = useState<FundingRound[]>([]);
  const [founder, setFounder] = useState<FounderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidModalRound, setBidModalRound] = useState<FundingRound | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const s = await startupsApi.get(Number(id));
      setStartup(s);
      const [roundList, founderList] = await Promise.all([
        roundsApi.list({ startup: s.id }),
        foundersApi.list(),
      ]);
      setRounds(roundList);
      setFounder(founderList.find((f) => f.user === s.founder) ?? null);
    } catch {
      setStartup(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBidSubmit = async (payload: BidPayload) => {
    await bidsApi.create(payload);
    await loadData();
  };

  const canBid = user?.role === 'investor';
  const openRounds = rounds.filter((r) => r.status === 'open');

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-900">
        <Navbar />
        <Spinner />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-ink-900">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20">
          <EmptyState
            icon={Rocket}
            title="Startup not found"
            description="This startup may have been removed or is not publicly available."
            action={
              <Link to="/startups">
                <Button>Browse startups</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/startups"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to startups
        </Link>

        {/* Hero */}
        <div className="glass-card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-bold text-xl shrink-0">
              {startup.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={startup.status} />
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                  {startup.sector}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{startup.name}</h1>
              {startup.tagline && (
                <p className="text-lg text-slate-400 mt-1">{startup.tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {startup.website_url && (
                  <a
                    href={startup.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:text-accent-300"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {startup.pitch_deck_url && (
                  <a
                    href={startup.pitch_deck_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:text-accent-300"
                  >
                    <Presentation className="h-4 w-4" />
                    Pitch deck
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
            <Metric label="Target raise" value={formatCurrency(startup.target_amount)} icon={TrendingUp} />
            <Metric label="Equity offered" value={formatPercent(startup.equity_offered)} icon={Wallet} />
            <Metric label="Founded" value={formatDate(startup.created_at)} icon={Rocket} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Description */}
          <div className="lg:col-span-2 space-y-6">
            {startup.description && (
              <div className="glass-card p-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  About
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {startup.description}
                </p>
              </div>
            )}

            {/* Funding rounds */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
                Funding rounds
              </h2>
              {rounds.length === 0 ? (
                <EmptyState
                  icon={Rocket}
                  title="No funding rounds"
                  description={startup.status === 'published' ? 'The founder hasn\'t opened any rounds yet.' : 'Rounds will appear here once opened.'}
                />
              ) : (
                <div className="space-y-3">
                  {rounds.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-white/5 bg-ink-800/40 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">{r.name}</h3>
                            <StatusBadge status={r.status} />
                          </div>
                          {r.description && (
                            <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                          )}
                        </div>
                        {r.status === 'open' && canBid && (
                          <Button size="sm" onClick={() => setBidModalRound(r)}>
                            Place a bid
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <MiniMetric label="Target" value={formatCurrency(r.target_amount)} />
                        <MiniMetric label="Min ticket" value={formatCurrency(r.minimum_ticket_size)} />
                        <MiniMetric label="Max ticket" value={formatCurrency(r.maximum_ticket_size)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Founder sidebar */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
                Founder
              </h2>
              {founder ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-bold text-sm">
                      {startup.founder_email[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {startup.founder_email}
                      </div>
                      {founder.headline && (
                        <div className="text-xs text-slate-500 truncate">{founder.headline}</div>
                      )}
                    </div>
                  </div>
                  {founder.company_name && (
                    <InfoRow label="Company" value={founder.company_name} />
                  )}
                  {founder.location && (
                    <InfoRow icon={MapPin} label="Location" value={founder.location} />
                  )}
                  {founder.website_url && (
                    <a
                      href={founder.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:text-accent-300 mt-3"
                    >
                      <Globe className="h-4 w-4" />
                      {founder.website_url}
                    </a>
                  )}
                  {founder.bio && (
                    <p className="text-sm text-slate-400 mt-4 pt-4 border-t border-white/5">
                      {founder.bio}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  <Mail className="h-4 w-4 inline mr-1.5" />
                  {startup.founder_email}
                </p>
              )}
            </div>

            {/* Bid CTA for logged-out */}
            {!user && (
              <div className="glass-card p-6 text-center">
                <Lock className="h-6 w-6 text-accent-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">Sign in to place a bid</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  You need an investor account to bid on funding rounds.
                </p>
                <Link to="/register?role=investor">
                  <Button className="w-full">Become an investor</Button>
                </Link>
              </div>
            )}

            {/* Bid CTA for founders */}
            {user?.role === 'founder' && (
              <div className="glass-card p-6 text-center">
                <Wallet className="h-6 w-6 text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">Founder account</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Only investors can place bids on funding rounds.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {bidModalRound && (
        <BidFormModal
          open={!!bidModalRound}
          onClose={() => setBidModalRound(null)}
          onSubmit={handleBidSubmit}
          round={bidModalRound}
        />
      )}
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-850/60 border border-white/5 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-300 mt-2">
      {Icon && <Icon className="h-4 w-4 text-slate-500" />}
      <span className="text-slate-500">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
