import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fieldError, getFieldErrors, getGenericError } from '@/lib/api';
import type { FieldErrors, Role } from '@/lib/types';
import { TextInput } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') as Mode) || 'login';
  const initialRole = (searchParams.get('role') as Role) || 'founder';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<Role>(initialRole);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setErrors({});
    setGenericError(null);
  }, [mode, role]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setGenericError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGenericError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, first_name: firstName, last_name: lastName, role, password, password2 });
      }
      navigate('/dashboard');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setGenericError(getGenericError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink-950">
        <Logo />
        <div className="max-w-sm">
          <h2 className="text-2xl font-bold text-white">
            The marketplace where real money moves.
          </h2>
          <p className="mt-3 text-slate-400 text-sm">
            Join thousands of founders and investors building the future on a platform
            designed for transparency and trust.
          </p>
        </div>
        <p className="text-xs text-slate-600">© 2026 InvestVault</p>
      </div>

      {/* Right: form */}
      <div className="flex flex-col justify-center px-4 sm:px-8 py-8 bg-ink-900">
        <div className="lg:hidden mb-8">
          <Logo />
        </div>

        <div className="w-full max-w-sm mx-auto">
          <h1 className="text-xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login' ? 'Sign in to access your dashboard.' : 'Start raising or investing in minutes.'}
          </p>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-white/10 bg-ink-800 p-1 mt-6 mb-5">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-accent-500 text-white' : 'text-slate-400'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-accent-500 text-white' : 'text-slate-400'}`}
            >
              Sign up
            </button>
          </div>

          {/* Role selector */}
          {mode === 'register' && (
            <div className="mb-5">
              <p className="text-xs font-medium text-slate-400 mb-2">I am a...</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('founder')}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${role === 'founder' ? 'border-accent-500 bg-accent-500/10' : 'border-white/10 bg-ink-800'}`}
                >
                  <span className="font-medium text-white">Founder</span>
                  <span className="block text-xs text-slate-500">Raising capital</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('investor')}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${role === 'investor' ? 'border-accent-500 bg-accent-500/10' : 'border-white/10 bg-ink-800'}`}
                >
                  <span className="font-medium text-white">Investor</span>
                  <span className="block text-xs text-slate-500">Deploying capital</span>
                </button>
              </div>
              {fieldError(errors, 'role') && <p className="text-xs text-rose-400 mt-1">{fieldError(errors, 'role')}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {genericError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                {genericError}
              </div>
            )}

            <TextInput
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldError(errors, 'email')}
              autoComplete="email"
            />

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="First name"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={fieldError(errors, 'first_name')}
                />
                <TextInput
                  label="Last name"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={fieldError(errors, 'last_name')}
                />
              </div>
            )}

            <TextInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldError(errors, 'password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            {mode === 'register' && (
              <TextInput
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                error={fieldError(errors, 'password2')}
                autoComplete="new-password"
              />
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>Don't have an account? <button onClick={() => switchMode('register')} className="text-accent-400 hover:text-accent-300">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => switchMode('login')} className="text-accent-400 hover:text-accent-300">Sign in</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
