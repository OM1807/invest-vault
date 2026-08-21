import { Link } from 'react-router-dom';

export default function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-md bg-accent-500 flex items-center justify-center">
        <span className="text-white text-sm font-bold">V</span>
      </div>
      <span className="text-base font-bold text-white">
        Invest<span className="text-accent-400">Vault</span>
      </span>
    </Link>
  );
}
