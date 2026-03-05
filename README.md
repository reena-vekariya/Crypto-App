# Crypto App

A production-ready, full-stack cryptocurrency app monorepo built with NestJS, React Native (Expo), and MySQL. 
---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | NestJS 10, TypeORM, MySQL 9 |
| Auth | JWT, bcrypt, Passport.js |
| Blockchain | ethers.js v6 (Ethereum / Sepolia testnet) |
| Price Feed | CoinGecko API |
| Mobile | React Native 0.83, Expo SDK 55 |
| Navigation | Expo Router v3 (file-based) |
| Styling | NativeWind v4 (Tailwind for RN) + StyleSheet |
| State | Zustand (auth + theme) |
| Data Fetching | TanStack React Query |
| HTTP Client | Axios (with JWT interceptor) |
| Shared Types | TypeScript package (`@crypto-app/shared-types`) |

---

## Repository Structure

```
Crypto-App/
├── package.json               # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .env.example
│
├── packages/
│   └── shared-types/          # Shared DTOs & TypeScript interfaces
│       └── src/index.ts
│
└── apps/
    ├── api/                   # NestJS REST API (port 3001)
    │   └── src/
    │       ├── auth/          # JWT register/login
    │       ├── users/         # User profile
    │       ├── wallets/       # ETH wallet generation & balance
    │       ├── transactions/  # Buy/Sell/Send/Receive
    │       ├── portfolio/     # Holdings + P&L calculation
    │       └── market/        # CoinGecko price feed
    │
    └── mobile/                # Expo React Native app
        ├── app/
        │   ├── (auth)/        # Login, Register, PIN screens
        │   ├── (tabs)/        # Home, Portfolio, Trade, Wallet, Settings
        │   ├── coin/[id].tsx  # Coin detail + trade form
        │   └── transactions/  # Transaction history
        ├── components/
        │   ├── ui/            # Button, Input, Card, Badge
        │   ├── home/          # PriceCard, PortfolioSummary
        │   ├── trade/         # OrderForm
        │   ├── wallet/        # AddressDisplay
        │   └── common/        # Header, LoadingSpinner, ThemeToggle
        ├── hooks/             # useAuth, useMarket, usePortfolio, useTheme
        ├── store/             # auth.store.ts, theme.store.ts
        ├── services/          # api.ts, auth/market/wallet/portfolio services
        └── constants/         # colors.ts, theme.ts
```

---

## Database Schema (MySQL via TypeORM)

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| email | varchar | Unique |
| password_hash | varchar | bcrypt hashed |
| full_name | varchar | |
| pin_hash | varchar | Nullable |
| is_2fa_enabled | boolean | Default false |
| totp_secret | varchar | Nullable |
| created_at | timestamp | |

### wallets
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| address | varchar | Ethereum address |
| encrypted_private_key | text | AES-256-CBC encrypted |
| network | varchar | `sepolia` / `mainnet` |
| created_at | timestamp | |

### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| type | enum | `buy` / `sell` / `send` / `receive` |
| coin_symbol | varchar | e.g. `BTC`, `ETH` |
| amount | decimal(18,8) | |
| price_usd | decimal(18,2) | Price at time of transaction |
| total_usd | decimal(18,2) | `amount × price_usd` |
| tx_hash | varchar | On-chain hash (nullable) |
| status | enum | `pending` / `completed` / `failed` |
| created_at | timestamp | |

---

## Prerequisites

- **Node.js** v18+ (tested on v25.2.1)
- **pnpm** v10+ — `npm install -g pnpm`
- **MySQL** 9+ — `brew install mysql`
- **Expo CLI** — `npm install -g expo-cli`
- **iOS Simulator** (Xcode) or Android Emulator

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/reena-vekariya/Crypto-App.git
cd Crypto-App
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up MySQL

```bash
# Install & start MySQL (macOS)
brew install mysql
brew services start mysql

# Create the database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS crypto_app;"
```

### 4. Configure environment variables

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=crypto_app
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PORT=3001
```

> Get a free Infura key at [infura.io](https://infura.io) for live Sepolia ETH balance queries.

### 5. Build shared types

```bash
cd packages/shared-types && pnpm build && cd ../..
```

### 6. Build & start the backend

```bash
cd apps/api
pnpm build
pnpm start
```

The API will be available at `http://localhost:3001`
Swagger docs at `http://localhost:3001/api/docs`

### 7. Start the mobile app

```bash
cd apps/mobile
pnpm start
```

Then press `i` for iOS Simulator or `a` for Android Emulator in the Expo DevTools.

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | — |
| POST | `/auth/login` | Login, get JWT token | — |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/me` | Get current user profile | ✅ |

### Wallets
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/wallets` | List all wallets | ✅ |
| POST | `/wallets` | Create new ETH wallet | ✅ |
| GET | `/wallets/primary` | Get or create primary wallet | ✅ |
| GET | `/wallets/:id/balance` | Get ETH balance | ✅ |

### Transactions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/transactions` | Create buy/sell/send/receive | ✅ |
| GET | `/transactions` | Transaction history | ✅ |
| GET | `/transactions/:id` | Single transaction | ✅ |

### Portfolio
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/portfolio` | Holdings + P&L summary | ✅ |

### Market
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/market/coins` | Top coins by market cap | — |
| GET | `/market/coins/:id` | Coin detail | — |
| GET | `/market/coins/:id/chart` | Price chart data | — |

---

## Mobile App Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Login | `/(auth)/login` | Email + password sign-in |
| Register | `/(auth)/register` | Create new account |
| PIN | `/(auth)/pin` | 6-digit PIN setup |
| Home | `/(tabs)/` | Live prices + portfolio summary |
| Portfolio | `/(tabs)/portfolio` | Holdings with P&L |
| Trade | `/(tabs)/trade` | Buy/Sell any listed coin |
| Wallet | `/(tabs)/wallet` | ETH address + QR code |
| Settings | `/(tabs)/settings` | Theme toggle, security, logout |
| Coin Detail | `/coin/[id]` | Price, stats, trade form |
| History | `/transactions` | Full transaction history |

---

## Design Tokens (CoinBase-inspired)

```
Primary Blue:   #0052FF
Background:     #FFFFFF (light)  /  #0A0B0D (dark)
Surface:        #F5F5F5 (light)  /  #1C1C1E (dark)
Text Primary:   #0A0B0D (light)  /  #FFFFFF (dark)
Text Secondary: #6B7280
Success Green:  #00B300
Error Red:      #FF4B4B
Tab Bar:        #FFFFFF (light)  /  #131417 (dark)
```

---

## Development Workflow

```bash
# Run both apps in parallel (from repo root)
pnpm dev

# Backend only (with hot reload)
cd apps/api && pnpm dev

# Mobile only
cd apps/mobile && pnpm start

# Build all packages
pnpm build

# Kill stale API process if port 3001 is busy
lsof -ti:3001 | xargs kill -9 2>/dev/null
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_HOST` | `localhost` | MySQL host |
| `DATABASE_PORT` | `3306` | MySQL port |
| `DATABASE_USER` | `root` | MySQL user |
| `DATABASE_PASSWORD` | _(empty)_ | MySQL password |
| `DATABASE_NAME` | `crypto_app` | Database name |
| `JWT_SECRET` | — | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `ETHEREUM_RPC_URL` | — | Infura/Alchemy Sepolia RPC URL |
| `PORT` | `3001` | API server port |
| `EXPO_PUBLIC_API_URL` | `http://localhost:3001` | Mobile API base URL |
| `EXPO_PUBLIC_ETHEREUM_NETWORK` | `sepolia` | Ethereum network |

---

## Security Notes

- Private keys are encrypted with **AES-256-CBC** before storing in MySQL
- Passwords hashed with **bcrypt** (12 rounds)
- JWT tokens expire in **7 days** — rotate `JWT_SECRET` in production
- CORS is open in development — restrict `origin` in production
- Never commit `.env` files — they are gitignored

