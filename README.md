# Goals Planning System

A goals-based financial planning tool for Indian clients: client demographics, accounts/investments, income,
expenses, KYC/risk profiling, and financial goals, with Monte Carlo portfolio projections (best/average/worst
case), cashflow projections, funding ratio, probability of achieving each goal, and worst 3-month drawdown.

## Architecture

```
GoalsPlanningSystem/
├── client/    React 19 + TypeScript + Vite, MUI, Recharts, TanStack Query, React Hook Form
├── server/    ASP.NET Core 10 Web API
│   ├── src/GoalsPlanningSystem.Domain          Entities, enums — no dependencies
│   ├── src/GoalsPlanningSystem.Infrastructure  EF Core, migrations (SQLite + SQL Server), seed data
│   ├── src/GoalsPlanningSystem.Simulation      Monte Carlo engine, Indian tax engine, metrics — pure C#
│   ├── src/GoalsPlanningSystem.Api             Controllers, Swagger, CORS
│   └── tests/GoalsPlanningSystem.Tests         xUnit
├── infra/     Bicep templates for Azure (SQL, App Service, Static Web App) — see infra/README.md
└── .github/workflows/deploy.yml   CI/CD (build/test/deploy on push to main)
```

See the domain model and design decisions in detail in the project's original planning notes; key points:

- **India-specific**: account types (EPF/PPF/NPS/ELSS/etc.), Old vs New income tax regime with slab tables,
  current post-2024-budget capital gains rules, NPS mandatory annuitization at retirement, ₹ Lakh/Crore
  formatting throughout the UI.
- **Monte Carlo engine**: monthly time-step, correlated across 6 asset classes (Cholesky decomposition),
  tax-optimized withdrawal ordering (Taxable → Tax-Deferred → Tax-Free), best/average/worst = 10th/50th/90th
  percentile bands.
- **No authentication** in this MVP (solo-advisor local tool) — structured with a single DI seam so it can be
  added later without a rewrite.

## Local development

### Prerequisites
- .NET 10 SDK
- Node.js 20+
- No database server needed — the API uses SQLite locally (`server/src/GoalsPlanningSystem.Api/*.dev.db`,
  gitignored), auto-created and seeded on first run.

### Run the API

```bash
cd server
dotnet run --project src/GoalsPlanningSystem.Api/GoalsPlanningSystem.Api.csproj
```

Swagger UI: http://localhost:5115/swagger (in Development environment).

### Run the client

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. The client reads the API base URL from `client/.env.development`
(`VITE_API_BASE_URL`, defaults to `http://localhost:5115/api`).

### Run tests

```bash
cd server
dotnet test
```

## Deploying to Azure

See [`infra/README.md`](infra/README.md). This is a manual, explicitly-approved step — nothing here
provisions Azure resources or pushes to GitHub automatically.

## Known simplifications (MVP scope)

- Tax: flat surcharge-free slab calculation with a single "Total Deductions" figure for the Old regime
  (no itemized 80C/80D/HRA breakdown); capital gains use current (post-July-2024) rules only, and every
  withdrawal is assumed long-term (no per-lot holding-period tracking).
- Migrations run automatically on API startup — fine for a single-instance low-traffic deployment, revisit
  before scaling to multiple instances.
- No authentication yet.
