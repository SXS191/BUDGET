# Focolare - Family Budget Management App

## Original Problem Statement
App per gestire budget familiare con possibilità di sincronizzazione del conto bancario (Plaid), multi-utente con notifiche push delle operazioni, tracciamento spese con icone e categorie, autenticazione JWT email/password. Deve funzionare sia da PC che da iPhone/Android.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI (Python) + MongoDB
- **Auth**: JWT with bcrypt password hashing
- **Bank Sync**: MOCKED Plaid integration (ready for real API keys)

## User Personas
1. **Family Owner**: Creates family, invites members, manages budgets
2. **Family Member**: Views shared budget, adds transactions, syncs accounts

## Core Requirements (Static)
- ✅ Multi-user family management
- ✅ JWT authentication (email/password)
- ✅ Bank account management (MOCKED Plaid)
- ✅ Transaction tracking with categories
- ✅ Budget management by category
- ✅ Dashboard with statistics and charts
- ✅ Mobile-responsive design (iOS/Android ready)
- ✅ Italian language interface

## What's Been Implemented (2026-03-12)
1. **Authentication System**
   - User registration with password validation
   - Login with JWT tokens
   - Session persistence in localStorage

2. **Family Management**
   - Create family groups
   - Invite members by email
   - Owner/member roles

3. **Bank Accounts (MOCKED)**
   - Add bank accounts with Italian banks
   - Sync generates random mock transactions
   - Balance tracking

4. **Transactions**
   - 15 categories with icons
   - Manual transaction entry
   - Filter by category/month
   - Group by date

5. **Budgets**
   - Set monthly budgets by category
   - Progress tracking
   - Over-budget alerts

6. **Dashboard**
   - Total balance, income, expenses
   - Monthly trend bar chart
   - Expenses by category pie chart
   - Recent transactions
   - Budget overview

7. **Mobile Design**
   - Bottom navigation bar
   - Touch-friendly targets (44px min)
   - Safe area insets for iOS
   - Responsive layouts

## P0/P1/P2 Features Remaining

### P0 (Critical)
- [ ] Add real Plaid API integration (requires PLAID_CLIENT_ID, PLAID_SECRET)
- [ ] Web Push notifications implementation

### P1 (High)
- [ ] Export transactions to CSV/PDF
- [ ] Recurring transactions
- [ ] Transaction search by description
- [ ] Family spending reports

### P2 (Nice to have)
- [ ] Dark mode toggle
- [ ] Multiple currencies
- [ ] Budget rollover
- [ ] Transaction tags

## Next Tasks
1. User to provide Plaid API keys for real bank sync
2. Implement Web Push notification service worker
3. Add export functionality
