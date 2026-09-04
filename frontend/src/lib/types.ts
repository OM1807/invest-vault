// ---- Auth ----
export type Role = 'founder' | 'investor';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  date_joined: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  password: string;
  password2: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ---- Startups ----
export type StartupStatus = 'draft' | 'published' | 'archived';

export interface Startup {
  id: number;
  founder: number;
  founder_email: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  sector: string;
  website_url: string;
  pitch_deck_url: string;
  target_amount: string;
  equity_offered: string;
  status: StartupStatus;
  created_at: string;
  updated_at: string;
}

export interface StartupPayload {
  name: string;
  tagline: string;
  description: string;
  sector: string;
  website_url: string;
  pitch_deck_url: string;
  target_amount: string;
  equity_offered: string;
  status: StartupStatus;
}

// ---- Founder profile ----
export interface FounderProfile {
  id: number;
  user: number;
  user_email: string;
  company_name: string;
  headline: string;
  bio: string;
  website_url: string;
  location: string;
}

export interface FounderProfilePayload {
  company_name: string;
  headline: string;
  bio: string;
  website_url: string;
  location: string;
}

// ---- Investor profile ----
export interface InvestorProfile {
  id: number;
  user: number;
  user_email: string;
  firm_name: string;
  headline: string;
  bio: string;
  investment_focus: string;
  min_ticket_size: string;
  max_ticket_size: string;
  website_url: string;
}

export interface InvestorProfilePayload {
  firm_name: string;
  headline: string;
  bio: string;
  investment_focus: string;
  min_ticket_size: string;
  max_ticket_size: string;
  website_url: string;
}

// ---- Funding rounds ----
export type RoundStatus = 'open' | 'closed' | 'funded';

export interface FundingRound {
  id: number;
  startup: number;
  startup_name: string;
  name: string;
  description: string;
  target_amount: string;
  minimum_ticket_size: string;
  maximum_ticket_size: string;
  status: RoundStatus;
  created_at: string;
  updated_at: string;
}

export interface FundingRoundPayload {
  startup: number;
  name: string;
  description: string;
  target_amount: string;
  minimum_ticket_size: string;
  maximum_ticket_size: string;
  status: RoundStatus;
}

// ---- Bids ----
export type BidStatus = 'pending' | 'accepted' | 'rejected';

export interface Bid {
  id: number;
  funding_round: number;
  funding_round_name: string;
  investor: number;
  investor_name: string;
  amount: string;
  equity_requested: string;
  message: string;
  status: BidStatus;
  created_at: string;
  updated_at: string;
}

export interface BidPayload {
  funding_round: number;
  amount: string;
  equity_requested: string;
  message: string;
}

// ---- API errors ----
export type FieldErrors = Record<string, string[]>;

// ---- Chat ----
export interface Message {
  id: number;
  conversation: number;
  sender: number;
  sender_name: string;
  text: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  id: number;
  startup: number;
  startup_name: string;
  founder: number;
  founder_name: string;
  investor: number;
  investor_name: string;
  created_at: string;
  last_message: Message | null;
}

export interface ConversationPayload {
  startup: number;
}
