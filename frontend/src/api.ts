import axios from 'axios'

type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  date_joined: string
}

type AuthResponse = {
  access: string
  refresh: string
  user: User
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

const persistAuth = (data: AuthResponse) => {
  localStorage.setItem('accessToken', data.access)
  localStorage.setItem('refreshToken', data.refresh)
  localStorage.setItem('user', JSON.stringify(data.user))
}

const clearAuth = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const login = async (email: string, password: string) => {
  const response = await api.post<AuthResponse>('/api/auth/login/', { email, password })
  persistAuth(response.data)
  return response.data
}

export const register = async (payload: {
  email: string
  first_name: string
  last_name: string
  role: string
  password: string
  password2: string
}) => {
  const response = await api.post<AuthResponse>('/api/auth/register/', payload)
  persistAuth(response.data)
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get<User>('/api/auth/me/')
  return response.data
}

export const logout = () => {
  clearAuth()
}

export const fetchStartups = async () => {
  const response = await api.get('/api/startups/')
  return response.data
}

export const createStartup = async (payload: {
  name: string
  tagline: string
  description: string
  sector: string
  website_url: string
  target_amount: string
  equity_offered: string
  status: string
}) => {
  const response = await api.post('/api/startups/', payload)
  return response.data
}

export const createFounderProfile = async (payload: {
  company_name: string
  headline: string
  bio: string
  website_url: string
  location: string
}) => {
  const response = await api.post('/api/founder-profiles/', payload)
  return response.data
}

export const createInvestorProfile = async (payload: {
  firm_name: string
  headline: string
  bio: string
  investment_focus: string
  min_ticket_size: string
  max_ticket_size: string
  website_url: string
}) => {
  const response = await api.post('/api/investor-profiles/', payload)
  return response.data
}

export const fetchFundingRounds = async () => {
  const response = await api.get('/api/investments/funding-rounds/')
  return response.data
}

export const createBid = async (payload: {
  funding_round: number
  amount: string
  equity_requested: string
  message: string
}) => {
  const response = await api.post('/api/investments/bids/', payload)
  return response.data
}

export default api
