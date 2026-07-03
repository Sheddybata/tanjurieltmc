# Tanjuriel Microfinance Platform

Enterprise-grade, role-based admin and teller platform for microfinance institutions. Built for Nigerian MFI operations with NIBSS inter-bank settlement and bill payment integrations.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 14 Web App (port 3000)              │
│  Role-based UI: Teller · Manager · Admin dashboards             │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / JWT
┌────────────────────────────▼────────────────────────────────────┐
│                   NestJS API (port 4000)                        │
│  Auth · Teller · Manager · Reporting · Audit · Integrations     │
└────────────────────────────┬────────────────────────────────────┘
                             │ Prisma ORM
┌────────────────────────────▼────────────────────────────────────┐
│              PostgreSQL 16  +  Redis 7 (cache/sessions)         │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  External: NIBSS NIP · Bill Payment API · (future: CBN reporting)│
└─────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
tanjuriel-microfinance/
├── apps/
│   ├── api/                  # NestJS REST API
│   │   └── src/
│   │       ├── common/       # Guards, decorators, interceptors, utils
│   │       └── modules/
│   │           ├── auth/     # JWT login, refresh, logout
│   │           ├── users/    # User CRUD (admin)
│   │           ├── teller/   # Customer reg, accounts, deposits/withdrawals
│   │           ├── manager/  # Loan workflow, portfolio monitoring
│   │           ├── reporting/# Dashboard metrics, transaction reports
│   │           ├── audit/    # Audit log query API
│   │           └── integrations/
│   │               ├── nibss/        # NIP name enquiry & transfers
│   │               └── bill-payment/ # Utility & airtime payments
│   └── web/                  # Next.js 14 App Router frontend
│       └── src/
│           ├── app/          # Pages by role (teller, manager, admin)
│           ├── components/   # Layout, UI components
│           └── lib/          # API client, auth context, navigation
├── packages/
│   ├── database/             # Prisma schema, migrations, seed
│   └── shared/               # Types, RBAC permissions, constants
├── docker-compose.yml        # PostgreSQL + Redis
└── turbo.json                # Turborepo task orchestration
```

## Role-Based Access Control

| Role    | Capabilities |
|---------|-------------|
| **Teller** | Customer registration, account opening, deposits, withdrawals, bill payments, dashboard |
| **Manager** | Loan applications, review/approve/reject/disburse, portfolio monitoring, reports, NIBSS transfers, audit logs |
| **Admin** | Full access: user management, branches, loan products, system settings, all manager capabilities |

Permissions are defined in `@tanjuriel/shared` and enforced via NestJS `PermissionsGuard` on every protected endpoint.

## Key Modules

### 1. Authentication
- JWT access tokens (8h) + refresh tokens (7d)
- bcrypt password hashing (12 rounds)
- Role + permission guards on all routes
- Automatic token refresh in the frontend API client

### 2. Teller Module
- Customer KYC registration with BVN/NIN
- Multi-type account opening (Savings, Current, Fixed Deposit)
- Atomic deposit/withdrawal transactions with balance tracking
- Transaction history per account

### 3. Manager Module
- Loan application with amortization schedule generation
- Multi-stage approval workflow: Submit → Review → Approve/Reject → Disburse
- Full approval audit trail per loan
- Portfolio monitoring: PAR, collection rate, loans by status

### 4. Reporting
- Real-time dashboard metrics (customers, accounts, daily txns, loans)
- Transaction reports with date range filtering
- Daily deposit/withdrawal trend charts

### 5. Audit Log
- Global interceptor logs all CREATE/UPDATE/DELETE operations
- Explicit login/logout/approve/disburse events
- Queryable by action, entity, user, date range

### 6. NIBSS Integration
- NIP Name Enquiry
- NIP Outward Fund Transfer
- Sandbox mock mode when credentials are not configured
- Full request/response logging in `nibss_transactions` table

### 7. Bill Payments
- Category/provider catalog (Electricity, Airtime, Cable, Water)
- Payment processing with status tracking
- Pluggable external API with sandbox fallback

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL and Redis)

### Setup

```bash
# 1. Clone and install
cd "tanjuriel microfinance"
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start database services
docker compose up -d

# 4. Run database migrations and seed
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev
```

### Access

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API | http://localhost:4000 |
| Swagger Docs | http://localhost:4000/api/docs |
| Prisma Studio | `npm run db:studio` |

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tanjuriel.com | Password123! |
| Manager | manager@tanjuriel.com | Password123! |
| Teller | teller@tanjuriel.com | Password123! |

## Database Schema

Core entities: `Branch`, `User`, `Customer`, `Account`, `Transaction`, `LoanProduct`, `Loan`, `LoanApproval`, `LoanSchedule`, `AuditLog`, `NibssTransaction`, `BillPayment`, `DailySnapshot`.

All financial amounts use `Decimal(18,2)`. Transactions are processed atomically via Prisma `$transaction`.

## API Endpoints (Summary)

| Module | Prefix | Key Routes |
|--------|--------|-----------|
| Auth | `/api/v1/auth` | POST login, refresh, logout; PATCH password |
| Users | `/api/v1/users` | CRUD system users |
| Teller | `/api/v1/teller` | customers, accounts, deposits, withdrawals |
| Manager | `/api/v1/manager` | loans, approve/reject/disburse, portfolio |
| Reporting | `/api/v1/reporting` | dashboard, transactions, trends |
| Audit | `/api/v1/audit` | GET logs |
| Integrations | `/api/v1/integrations` | nibss/*, bills/* |

Full API documentation available at `/api/docs` when the API is running.

## Production Deployment Checklist

- [ ] Set strong `JWT_SECRET` and `NEXTAUTH_SECRET`
- [ ] Configure production `DATABASE_URL`
- [ ] Add NIBSS production credentials
- [ ] Enable HTTPS / TLS termination
- [ ] Set up database backups
- [ ] Configure log aggregation (e.g. Datadog, CloudWatch)
- [ ] Run `npm run build` and deploy API + Web separately
- [ ] Set `CORS_ORIGIN` to production frontend URL

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Recharts |
| Backend | NestJS 10, Passport JWT, class-validator |
| Database | PostgreSQL 16, Prisma 5 |
| Cache | Redis 7 |
| Monorepo | Turborepo, npm workspaces |
| Integrations | NIBSS NIP, Bill Payment API |

## License

Proprietary — Tanjuriel Microfinance
