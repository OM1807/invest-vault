import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Rocket } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import StartupCard from '@/components/cards/StartupCard';
import { startupsApi } from '@/lib/api';
import type { Startup } from '@/lib/types';

const SECTORS = [
  'All',
  'SaaS',
  'Fintech',
  'Healthtech',
  'AI/ML',
  'Climate',
  'Consumer',
  'Web3',
  'DevTools',
  'Marketplace',
  'Hardware',
  'EdTech',
  'Other',
];

export default function BrowseStartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [filtered, setFiltered] = useState<Startup[]>([]);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startupsApi
      .list()
      .then((list) => {
        const published = list.filter((s) => s.status === 'published');
        setStartups(published);
        setFiltered(published);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = startups;
    if (sector !== 'All') result = result.filter((s) => s.sector === sector);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [startups, sector, search]);

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Browse startups</h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover published startups raising capital on InvestVault.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              className="input-base pl-10"
              placeholder="Search startups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select
              className="input-base pl-10 appearance-none pr-8"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.1rem',
              }}
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All sectors' : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No startups found"
            description={search || sector !== 'All' ? 'Try adjusting your search or filters.' : 'No published startups yet. Check back soon.'}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <StartupCard key={s.id} startup={s} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
