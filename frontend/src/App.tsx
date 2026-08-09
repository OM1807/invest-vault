import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import {
  createBid,
  createFounderProfile,
  createInvestorProfile,
  createStartup,
  fetchFundingRounds,
  fetchStartups,
  getCurrentUser,
  login,
  logout,
  register,
} from './api'

type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  date_joined: string
}

type Startup = {
  id: number
  name: string
  description: string
  sector: string
  target_amount: string
  equity_offered: string
  status: string
  founder_email?: string
  tagline?: string
  website_url?: string
}

type FundingRound = {
  id: number
  name: string
  description: string
  target_amount: string
  minimum_ticket_size: string
  maximum_ticket_size: string
  status: string
  startup_name: string
}

type AuthMode = 'login' | 'register'

function AuthPage({
  mode,
  setMode,
  onAuthenticated,
}: {
  mode: AuthMode
  setMode: (mode: AuthMode) => void
  onAuthenticated: (user: User) => void
}) {
  const [email, setEmail] = useState('investor@example.com')
  const [password, setPassword] = useState('secret123')
  const [password2, setPassword2] = useState('secret123')
  const [firstName, setFirstName] = useState('Ada')
  const [lastName, setLastName] = useState('Lovelace')
  const [role, setRole] = useState('investor')
  const [status, setStatus] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      if (mode === 'register') {
        const response = await register({
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          password,
          password2,
        })
        onAuthenticated(response.user)
        setStatus('Account created successfully')
      } else {
        const response = await login(email, password)
        onAuthenticated(response.user)
        setStatus('Logged in successfully')
      }
    } catch (error) {
      setStatus('Authentication failed')
      console.error(error)
    }
  }

  return (
    <div className="page-shell">
      <div className="card auth-card">
        <h1>InvestVault</h1>
        <p>Connect founders and investors around real startup opportunities.</p>
        <div className="toggle-row">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          {mode === 'register' ? (
            <>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="investor">Investor</option>
                <option value="founder">Founder</option>
              </select>
            </>
          ) : null}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
          {mode === 'register' ? (
            <input value={password2} onChange={(e) => setPassword2(e.target.value)} type="password" placeholder="Confirm password" />
          ) : null}
          <button type="submit">{mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>

        {status ? <p className="status">{status}</p> : null}
      </div>
    </div>
  )
}

function DashboardPage({
  user,
  onLogout,
}: {
  user: User
  onLogout: () => void
}) {
  const [startups, setStartups] = useState<Startup[]>([])
  const [rounds, setRounds] = useState<FundingRound[]>([])
  const [status, setStatus] = useState('')
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null)
  const [startupForm, setStartupForm] = useState({
    name: '',
    tagline: '',
    description: '',
    sector: '',
    website_url: '',
    target_amount: '100000',
    equity_offered: '10',
  })
  const [founderProfileForm, setFounderProfileForm] = useState({
    company_name: '',
    headline: '',
    bio: '',
    website_url: '',
    location: '',
  })
  const [investorProfileForm, setInvestorProfileForm] = useState({
    firm_name: '',
    headline: '',
    bio: '',
    investment_focus: '',
    min_ticket_size: '1000',
    max_ticket_size: '25000',
    website_url: '',
  })
  const [bidForm, setBidForm] = useState({
    amount: '5000',
    equity_requested: '5',
    message: 'Happy to support this company',
  })

  const loadData = async () => {
    try {
      const [startupData, roundData] = await Promise.all([fetchStartups(), fetchFundingRounds()])
      setStartups(startupData)
      setRounds(roundData)
    } catch (error) {
      console.error(error)
      setStatus('Could not load dashboard data')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateStartup = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createStartup({
        ...startupForm,
        status: 'published',
      })
      setStatus('Startup created successfully')
      await loadData()
    } catch (error) {
      console.error(error)
      setStatus('Could not create startup')
    }
  }

  const handleCreateFounderProfile = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createFounderProfile(founderProfileForm)
      setStatus('Founder profile created successfully')
    } catch (error) {
      console.error(error)
      setStatus('Could not create founder profile')
    }
  }

  const handleCreateInvestorProfile = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createInvestorProfile(investorProfileForm)
      setStatus('Investor profile created successfully')
    } catch (error) {
      console.error(error)
      setStatus('Could not create investor profile')
    }
  }

  const handleSubmitBid = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedRoundId) {
      setStatus('Select a funding round first')
      return
    }

    try {
      await createBid({
        funding_round: selectedRoundId,
        amount: bidForm.amount,
        equity_requested: bidForm.equity_requested,
        message: bidForm.message,
      })
      setStatus('Bid submitted successfully')
    } catch (error) {
      console.error(error)
      setStatus('Could not submit bid')
    }
  }

  return (
    <div className="page-shell dashboard-shell">
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Welcome back</h2>
            <p>{user.first_name} {user.last_name} • {user.role}</p>
          </div>
          <button className="ghost-button" onClick={onLogout}>Logout</button>
        </div>

        {status ? <p className="status">{status}</p> : null}

        {user.role === 'founder' ? (
          <div className="panel-grid">
            <section className="card panel">
              <h3>Create startup</h3>
              <form onSubmit={handleCreateStartup} className="form-stack">
                <input value={startupForm.name} onChange={(e) => setStartupForm({ ...startupForm, name: e.target.value })} placeholder="Startup name" />
                <input value={startupForm.tagline} onChange={(e) => setStartupForm({ ...startupForm, tagline: e.target.value })} placeholder="Tagline" />
                <textarea value={startupForm.description} onChange={(e) => setStartupForm({ ...startupForm, description: e.target.value })} placeholder="Description" />
                <input value={startupForm.sector} onChange={(e) => setStartupForm({ ...startupForm, sector: e.target.value })} placeholder="Sector" />
                <input value={startupForm.website_url} onChange={(e) => setStartupForm({ ...startupForm, website_url: e.target.value })} placeholder="Website URL" />
                <input value={startupForm.target_amount} onChange={(e) => setStartupForm({ ...startupForm, target_amount: e.target.value })} placeholder="Target amount" />
                <input value={startupForm.equity_offered} onChange={(e) => setStartupForm({ ...startupForm, equity_offered: e.target.value })} placeholder="Equity offered" />
                <button type="submit">Save startup</button>
              </form>
            </section>

            <section className="card panel">
              <h3>Create founder profile</h3>
              <form onSubmit={handleCreateFounderProfile} className="form-stack">
                <input value={founderProfileForm.company_name} onChange={(e) => setFounderProfileForm({ ...founderProfileForm, company_name: e.target.value })} placeholder="Company name" />
                <input value={founderProfileForm.headline} onChange={(e) => setFounderProfileForm({ ...founderProfileForm, headline: e.target.value })} placeholder="Headline" />
                <textarea value={founderProfileForm.bio} onChange={(e) => setFounderProfileForm({ ...founderProfileForm, bio: e.target.value })} placeholder="Bio" />
                <input value={founderProfileForm.website_url} onChange={(e) => setFounderProfileForm({ ...founderProfileForm, website_url: e.target.value })} placeholder="Website URL" />
                <input value={founderProfileForm.location} onChange={(e) => setFounderProfileForm({ ...founderProfileForm, location: e.target.value })} placeholder="Location" />
                <button type="submit">Save profile</button>
              </form>
            </section>
          </div>
        ) : null}

        {user.role === 'investor' ? (
          <div className="panel-grid">
            <section className="card panel">
              <h3>Create investor profile</h3>
              <form onSubmit={handleCreateInvestorProfile} className="form-stack">
                <input value={investorProfileForm.firm_name} onChange={(e) => setInvestorProfileForm({ ...investorProfileForm, firm_name: e.target.value })} placeholder="Firm name" />
                <input value={investorProfileForm.headline} onChange={(e) => setInvestorProfileForm({ ...investorProfileForm, headline: e.target.value })} placeholder="Headline" />
                <textarea value={investorProfileForm.bio} onChange={(e) => setInvestorProfileForm({ ...investorProfileForm, bio: e.target.value })} placeholder="Bio" />
                <input value={investorProfileForm.investment_focus} onChange={(e) => setInvestorProfileForm({ ...investorProfileForm, investment_focus: e.target.value })} placeholder="Investment focus" />
                <input value={investorProfileForm.min_ticket_size} onChange={(e) => setInvestorProfileForm({ ...investorProfileForm, min_ticket_size: e.target.value })} placeholder="Min ticket size" />
                <input value={investorProfileForm.max_ticket_size} onChange={(e) => setInvestorProfileForm({ ...investorProfileForm, max_ticket_size: e.target.value })} placeholder="Max ticket size" />
                <input value={investorProfileForm.website_url} onChange={(e) => setInvestorProfileForm({ ...investorProfileForm, website_url: e.target.value })} placeholder="Website URL" />
                <button type="submit">Save profile</button>
              </form>
            </section>

            <section className="card panel">
              <h3>Place a bid</h3>
              <form onSubmit={handleSubmitBid} className="form-stack">
                <select value={selectedRoundId ?? ''} onChange={(e) => setSelectedRoundId(Number(e.target.value))}>
                  <option value="">Select a funding round</option>
                  {rounds.map((round) => (
                    <option key={round.id} value={round.id}>{round.name} • {round.startup_name}</option>
                  ))}
                </select>
                <input value={bidForm.amount} onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })} placeholder="Amount" />
                <input value={bidForm.equity_requested} onChange={(e) => setBidForm({ ...bidForm, equity_requested: e.target.value })} placeholder="Equity requested" />
                <textarea value={bidForm.message} onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })} placeholder="Message" />
                <button type="submit">Submit bid</button>
              </form>
            </section>
          </div>
        ) : null}

        <section className="card panel">
          <h3>Startups</h3>
          {startups.map((startup) => (
            <div key={startup.id} className="list-item">
              <strong>{startup.name}</strong>
              <p>{startup.tagline || startup.description}</p>
              <small>{startup.sector} • target {startup.target_amount}</small>
            </div>
          ))}
        </section>

        <section className="card panel">
          <h3>Funding rounds</h3>
          {rounds.map((round) => (
            <div key={round.id} className="list-item">
              <strong>{round.name}</strong>
              <p>{round.description}</p>
              <small>{round.startup_name} • {round.status}</small>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  useEffect(() => {
    const syncUser = async () => {
      if (!localStorage.getItem('accessToken')) {
        return
      }
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error(error)
      }
    }

    syncUser()
  }, [])

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    logout()
    setCurrentUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? (
              <DashboardPage user={currentUser} onLogout={handleLogout} />
            ) : (
              <AuthPage mode={authMode} setMode={setAuthMode} onAuthenticated={handleAuthenticated} />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
