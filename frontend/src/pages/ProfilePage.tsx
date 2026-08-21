import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import FounderProfileForm from '@/components/forms/FounderProfileForm';
import InvestorProfileForm from '@/components/forms/InvestorProfileForm';
import { foundersApi, investorsApi } from '@/lib/api';
import type { FounderProfile, InvestorProfile, FounderProfilePayload, InvestorProfilePayload } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Globe, MapPin, Briefcase, Wallet } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'founder') {
          const list = await foundersApi.list();
          setFounderProfile(list.find((p) => p.user === user.id) ?? null);
        } else if (user?.role === 'investor') {
          const list = await investorsApi.list();
          setInvestorProfile(list.find((p) => p.user === user.id) ?? null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleFounderSubmit = async (payload: FounderProfilePayload) => {
    if (founderProfile) {
      setFounderProfile(await foundersApi.update(founderProfile.id, payload));
    } else {
      setFounderProfile(await foundersApi.create(payload));
    }
  };

  const handleInvestorSubmit = async (payload: InvestorProfilePayload) => {
    if (investorProfile) {
      setInvestorProfile(await investorsApi.update(investorProfile.id, payload));
    } else {
      setInvestorProfile(await investorsApi.create(payload));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-900">
        <Navbar />
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My profile</h1>
            <p className="text-sm text-slate-400 mt-1">
              {user?.role === 'founder'
                ? 'Your founder profile visible to investors.'
                : 'Your investor profile visible to founders.'}
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            {founderProfile || investorProfile ? 'Edit profile' : 'Create profile'}
          </Button>
        </div>

        {/* Account info */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Account
          </h2>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-bold text-lg">
              {user?.first_name[0]}
              {user?.last_name[0]}
            </div>
            <div>
              <div className="text-base font-semibold text-white">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-sm text-slate-500">{user?.email}</div>
              <div className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 text-xs font-medium text-accent-300 capitalize">
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Founder profile */}
        {user?.role === 'founder' && (
          <div className="glass-card p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Founder profile
            </h2>
            {founderProfile ? (
              <div className="space-y-3">
                <ProfileField label="Company" value={founderProfile.company_name} />
                <ProfileField label="Headline" value={founderProfile.headline} />
                <ProfileField label="Bio" value={founderProfile.bio} multiline />
                <ProfileField label="Location" value={founderProfile.location} icon={MapPin} />
                {founderProfile.website_url && (
                  <a
                    href={founderProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:text-accent-300"
                  >
                    <Globe className="h-4 w-4" />
                    {founderProfile.website_url}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-3">
                  You haven't created a founder profile yet.
                </p>
                <Button onClick={() => setModalOpen(true)}>Create profile</Button>
              </div>
            )}
          </div>
        )}

        {/* Investor profile */}
        {user?.role === 'investor' && (
          <div className="glass-card p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Investor profile
            </h2>
            {investorProfile ? (
              <div className="space-y-3">
                <ProfileField label="Firm" value={investorProfile.firm_name} />
                <ProfileField label="Headline" value={investorProfile.headline} />
                <ProfileField label="Bio" value={investorProfile.bio} multiline />
                <ProfileField label="Investment focus" value={investorProfile.investment_focus} />
                <div className="grid grid-cols-2 gap-3">
                  <ProfileField label="Min ticket" value={`$${investorProfile.min_ticket_size}`} />
                  <ProfileField label="Max ticket" value={`$${investorProfile.max_ticket_size}`} />
                </div>
                {investorProfile.website_url && (
                  <a
                    href={investorProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:text-accent-300"
                  >
                    <Globe className="h-4 w-4" />
                    {investorProfile.website_url}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-3">
                  You haven't created an investor profile yet.
                </p>
                <Button onClick={() => setModalOpen(true)}>Create profile</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {user?.role === 'founder' ? (
        <FounderProfileForm
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleFounderSubmit}
          profile={founderProfile}
        />
      ) : (
        <InvestorProfileForm
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleInvestorSubmit}
          profile={investorProfile}
        />
      )}
    </div>
  );
}

function ProfileField({
  label,
  value,
  multiline,
  icon: Icon,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  icon?: any;
}) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className={`text-sm text-slate-200 ${multiline ? 'whitespace-pre-wrap' : ''} flex items-center gap-1.5`}>
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
        {value}
      </div>
    </div>
  );
}
