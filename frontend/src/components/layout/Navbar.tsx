import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import { MessageCircle } from 'lucide-react';
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems =
    user?.role === 'founder'
      ? [
          { to: '/dashboard', label: 'My Startups' },
          { to: '/startups', label: 'Browse' },
        ]
      : user?.role === 'investor'
      ? [
          { to: '/dashboard', label: 'Browse' },
          { to: '/dashboard?tab=bids', label: 'My Bids' },
        ]
      : [];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            {user && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive(item.to) ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/profile" className="text-sm text-slate-300 hover:text-white">
                  {user.first_name}
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-slate-300 text-sm" onClick={() => setOpen(!open)}>
            Menu
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-ink-900 px-4 py-3 space-y-1">
          {user ? (
            <>
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5">
                  {item.label}
                </Link>
              ))}
              <Link to="/profile" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5">
                Profile
              </Link>
              <Link to="/chat" className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5">
                <MessageCircle className="h-4 w-4" />
                Messages
              </Link>
              <button onClick={() => { setOpen(false); handleLogout(); }} className="block w-full text-left rounded-md px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10">
                Sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full">Sign in</Button>
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                <Button className="w-full">Get started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
