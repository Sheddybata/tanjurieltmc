# Tanjuriel Microfinance Mobile App

Production-ready Flutter architecture for a customer-facing microfinance banking application.

## Architecture Overview

```
lib/
├── app.dart                    # Root MaterialApp + theme + router
├── main.dart                   # Entry point
├── core/                       # Cross-cutting concerns
│   ├── constants/              # App config, API endpoints, NIBSS codes
│   ├── errors/                 # Exception & failure types
│   ├── network/                # Dio client, interceptors
│   ├── router/                 # GoRouter navigation
│   ├── security/               # Secure storage, biometrics
│   ├── theme/                  # Colors, typography, Material theme
│   ├── utils/                  # Validators, formatters, masking
│   └── widgets/                # Reusable UI components
├── features/                   # Feature modules (Clean Architecture)
│   ├── auth/                   # Onboarding, login, registration
│   ├── kyc/                    # BVN, NIN, face capture
│   ├── dashboard/              # Home, balance, quick actions
│   ├── transfer/               # NIBSS NIP transfers
│   ├── bills/                  # Airtime, data, utilities
│   ├── transactions/           # History & receipts
│   └── profile/                # Profile & security settings
└── shared/
    ├── models/                 # Domain models
    ├── providers/              # Repository DI
    └── shell/                  # Bottom navigation shell
```

## Design Patterns

| Layer | Responsibility |
|-------|----------------|
| **Presentation** | Screens, widgets, Riverpod state notifiers |
| **Domain** | Repository interfaces, business contracts |
| **Data** | Repository implementations, API/mock data |

- **State Management**: `flutter_riverpod`
- **Navigation**: `go_router` with auth guards
- **Networking**: `dio` with auth/logging/error interceptors
- **Security**: `flutter_secure_storage`, `local_auth`

## Feature Modules

### 1. Onboarding & KYC
- Welcome → Register → KYC flow
- BVN verification (NIBSS-linked identity)
- NIN verification (NIMC-integrated)
- Face capture liveness check
- KYC status tracking

### 2. Dashboard
- Masked/unmasked balance toggle
- Quick actions: Transfer, Bills, Airtime, History
- Recent transactions feed

### 3. Transfers (NIBSS NIP)
- Bank list with NIBSS institution codes
- Name enquiry with session ID caching
- Transfer initiation with PIN authorization
- NIBSS response code handling (`00`, `07`, `51`, `94`, `96`, `97`)

### 4. Bill Payments
- Categories: Airtime, Data, Electricity, Cable, Water, Internet
- Customer/meter validation
- PIN-authorized payments

### 5. Transaction History
- Filterable list (All / Credits / Debits)
- Detailed receipts with copy reference
- Session ID & fee breakdown for transfers

### 6. Profile & Security
- Biometric login toggle
- Password & PIN change
- KYC status, sign out

## Running the App

```bash
flutter pub get
flutter run
```

### Demo Credentials
- **Login**: `adaeze@email.com` / `Password1`
- **OTP**: `123456`
- **Transfer test account**: Any 10-digit number (name enquiry returns CHUKWU EMELA)
- **Invalid account**: `0000000000`

## Backend Integration

Replace mock repositories in `features/*/data/repositories/` with real API calls via `ApiClient`. Endpoints are defined in `lib/core/constants/api_endpoints.dart`.

### NIBSS Transfer Flow
1. `GET /nibss/banks` — institution list
2. `POST /nibss/name-enquiry` — returns `session_id` (required for transfer)
3. `POST /nibss/transfer` — uses cached session, PIN, amount
4. `GET /nibss/transfer/status` — poll for timeout (`97`) retries

## Security Considerations

- Tokens stored in encrypted secure storage
- PIN never persisted in plain text (hash on device)
- Biometric auth via platform APIs
- Balance masking by default
- Session timeout configuration in `AppConstants`

## Next Steps for Production

1. Wire real BVN/NIN verification APIs (VerifyMe, YouVerify, or direct NIBSS/NIMC)
2. Add certificate pinning to Dio
3. Implement proper PIN hashing (bcrypt/argon2 server-side)
4. Add push notifications for transactions
5. Integrate real camera for face capture
6. Add unit/widget tests per feature module
