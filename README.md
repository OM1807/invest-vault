# InvestVault — Startup Investment Platform

A full-stack, multi-role platform that connects **founders** raising capital with **investors** placing bids on startup pitches — with real-time deal-room messaging and safeguards against concurrent-bid race conditions.

---

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Core Engineering Decisions](#core-engineering-decisions)
  - [1. Preventing Race Conditions on Concurrent Bids](#1-preventing-race-conditions-on-concurrent-bids)
  - [2. Real-Time Messaging with WebSockets + Redis Pub/Sub](#2-real-time-messaging-with-websockets--redis-pubsub)
  - [3. Authentication & Role-Based Access Control](#3-authentication--role-based-access-control)
- [Database Schema (High-Level)](#database-schema-high-level)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Future Improvements](#future-improvements)

---

## Overview

InvestVault digitizes the early-stage fundraising workflow: a founder creates a startup profile and pitch, investors browse live pitches and place bids, and once a bid is accepted, both parties move into a private real-time deal room to negotiate terms. The platform enforces strict role separation (founder vs. investor), guarantees that bid data never becomes inconsistent under concurrent load, and keeps investor–founder conversations synced instantly across devices.

## Key Features

- **Multi-role platform** — separate founder and investor experiences, dashboards, and permissions from a single codebase.
- **Startup pitch listings** — founders publish pitch decks, funding targets, equity offered, and round details.
- **Concurrent-safe bidding** — investors place bids on live rounds without risking double-allocation or lost updates when multiple bids land at the same time.
- **Real-time deal-room chat** — instant messaging between a founder and an investor once a bid is accepted, powered by WebSockets.
- **Secure, role-aware authentication** — JWT-based login with automatic refresh token rotation and role-based route protection.
- **Notifications** — real-time alerts (new bid, bid accepted/rejected, new message) pushed to the relevant user without polling.

## Tech Stack

| Layer            | Technology                                   |
|------------------|-----------------------------------------------|
| Frontend         | React, WebSocket client                       |
| Backend          | Django, Django REST Framework                 |
| Real-time layer  | Django Channels (ASGI), WebSockets, Redis Pub/Sub |
| Database         | PostgreSQL                                     |
| Cache / Broker   | Redis                                          |
| Auth             | JWT (access + refresh tokens)                  |

## System Architecture

```
┌────────────┐        HTTPS (REST)        ┌───────────────────┐
│   React    │ ─────────────────────────▶ │   Django + DRF     │
│  Frontend  │ ◀───────────────────────── │   (business logic) │
└─────┬──────┘                            └─────────┬──────────┘
      │            WebSocket (WSS)                  │
      │ ◀──────────────────────────────────────────▶ │
      │                                    ┌─────────▼──────────┐
      │                                    │  Django Channels    │
      │                                    │  (ASGI consumer)    │
      │                                    └─────────┬──────────┘
      │                                              │ Pub/Sub
      │                                    ┌─────────▼──────────┐
      │                                    │       Redis         │
      │                                    │ (channel layer +    │
      │                                    │  cache)              │
      │                                    └─────────┬──────────┘
      │                                              │
      │                                    ┌─────────▼──────────┐
      │                                    │    PostgreSQL        │
      │                                    │ (bids, users, deals) │
      │                                    └─────────────────────┘
```

- REST API handles standard CRUD (auth, pitch creation, bid submission, deal state).
- Django Channels holds a persistent WebSocket connection per active user.
- Redis acts as the **channel layer**, allowing any Django/Channels worker process to publish a message and have it fan out to the correct connected client(s) — this is what lets messaging and notifications scale across multiple server processes instead of being tied to a single in-memory connection.

## Core Engineering Decisions

### 1. Preventing Race Conditions on Concurrent Bids

**Problem:** Two investors could submit a bid on the same round within milliseconds of each other. Without protection, both requests could read the same "current highest bid" or "remaining allocation" value, both pass validation, and both write — corrupting the round's state (a classic lost-update / race condition).

**Solution:** Row-level locking at the database layer using PostgreSQL's `SELECT ... FOR UPDATE`.

```python
from django.db import transaction

@transaction.atomic
def place_bid(round_id, investor, amount):
    # Locks this specific row until the transaction commits,
    # forcing any concurrent bid on the same round to wait its turn.
    round_obj = FundingRound.objects.select_for_update().get(id=round_id)

    if amount <= round_obj.current_highest_bid:
        raise ValueError("Bid must exceed current highest bid")

    round_obj.current_highest_bid = amount
    round_obj.save()

    Bid.objects.create(round=round_obj, investor=investor, amount=amount)
```

- `select_for_update()` takes a row-level lock, so a second concurrent request for the *same round* blocks until the first transaction commits or rolls back.
- Wrapping it in `@transaction.atomic` ensures the read-check-write sequence is a single atomic unit — no other transaction can interleave between the check and the write.
- Bids on **different** rounds are unaffected and continue to process in parallel — the lock is scoped to the specific row, not the whole table.

### 2. Real-Time Messaging with WebSockets + Redis Pub/Sub

- Each authenticated client opens a WebSocket connection to a Django Channels consumer scoped to their deal room (`/ws/deals/<deal_id>/`).
- On receiving a message, the consumer publishes it to a Redis channel unique to that deal room.
- Redis fans that message out to every server process with a client subscribed to that room, and each process pushes it down the corresponding WebSocket connection.
- This decouples "who is connected to which server process" from "who needs to receive this message" — necessary once you run more than one backend instance.

### 3. Authentication & Role-Based Access Control

- **JWT access + refresh tokens**: short-lived access token for API calls, longer-lived refresh token to silently re-issue access tokens without forcing re-login.
- **Refresh token rotation**: every time a refresh token is used, it's invalidated and replaced with a new one — so a leaked/stolen refresh token has a single-use window rather than being valid for its entire lifetime.
- **Role-based access control (RBAC)**: middleware/permission classes check the authenticated user's role (`founder` / `investor`) before allowing access to role-specific endpoints (e.g., only founders can create a pitch; only investors can place a bid).

## Database Schema (High-Level)

```
User (id, email, password_hash, role[founder|investor], created_at)
Startup (id, founder_id → User, name, pitch_deck_url, sector)
FundingRound (id, startup_id → Startup, target_amount, equity_offered, current_highest_bid, status, closes_at)
Bid (id, round_id → FundingRound, investor_id → User, amount, created_at)
Deal (id, round_id → FundingRound, founder_id → User, investor_id → User, status)
Message (id, deal_id → Deal, sender_id → User, content, sent_at)
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Backend Setup
```bash
git clone https://github.com/om1807/investvault.git
cd investvault/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# configure DB and Redis in .env (see Environment Variables below)
python manage.py migrate
python manage.py runserver
```

### Running Channels/WebSocket Server
```bash
daphne -p 8001 investvault.asgi:application
```

### Frontend Setup
```bash
cd ../frontend
npm install
npm start
```

## Environment Variables

```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:password@localhost:5432/investvault
REDIS_URL=redis://localhost:6379/0
ACCESS_TOKEN_LIFETIME_MIN=15
REFRESH_TOKEN_LIFETIME_DAYS=7
```

## Project Structure

```
investvault/
├── backend/
│   ├── users/          # auth, JWT, RBAC
│   ├── startups/        # startup + funding round models & views
│   ├── bids/             # bid placement logic (row-locking)
│   ├── deals/            # deal room + messaging (Channels consumers)
│   └── investvault/      # settings, asgi.py, urls.py
├── frontend/
│   ├── src/components/
│   ├── src/pages/
│   └── src/sockets/       # WebSocket client hooks
└── README.md
```

## API Overview

| Method | Endpoint                          | Description                          | Auth        |
|--------|------------------------------------|---------------------------------------|-------------|
| POST   | `/api/auth/register/`             | Register as founder or investor       | Public      |
| POST   | `/api/auth/login/`                | Obtain access + refresh token          | Public      |
| POST   | `/api/auth/refresh/`              | Rotate refresh token                   | Refresh token |
| POST   | `/api/startups/`                  | Create a startup pitch                | Founder     |
| GET    | `/api/rounds/`                    | List open funding rounds              | Authenticated |
| POST   | `/api/rounds/<id>/bid/`           | Place a bid (row-locked)              | Investor    |
| GET    | `/api/deals/<id>/messages/`       | Fetch deal room message history       | Participant |
| WS     | `/ws/deals/<id>/`                 | Real-time deal room channel           | Participant |

## Future Improvements

- Add idempotency keys on bid submission to guard against duplicate network retries.
- Move Redis channel layer to a managed cluster for production HA.
- Add audit logging for all bid and deal-status changes (important for a financial-adjacent product).
- Rate-limit bid submissions per investor to mitigate abuse.
