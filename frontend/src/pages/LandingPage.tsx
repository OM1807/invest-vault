import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-900 flex flex-col">
      <Navbar />

      <section className="mx-auto max-w-3xl px-4 py-20 text-center flex-1 flex flex-col justify-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Raise capital. Back the next big thing.
        </h1>
        <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
          InvestVault connects founders with investors in a transparent marketplace.
          Open rounds, place bids, and close deals — all in one place.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register?role=founder">
            <Button size="lg">Raise as a founder</Button>
          </Link>
          <Link to="/register?role=investor">
            <Button size="lg" variant="ghost">Invest as an investor</Button>
          </Link>
        </div>
        <div className="mt-6">
          <Link to="/startups" className="text-sm text-slate-400 hover:text-white">
            or browse startups →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
