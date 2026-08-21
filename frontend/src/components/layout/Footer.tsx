import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-950 mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-slate-600">© 2026 InvestVault. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
