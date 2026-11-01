# SitePulse — Serverless Website Uptime Monitoring Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" />
  <img src="https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20API%20Gateway-orange?logo=amazon-aws" />
  <img src="https://img.shields.io/badge/SAM-Serverless-yellow?logo=amazon-aws" />
  <img src="https://img.shields.io/badge/Node.js-20.x-green?logo=node.js" />
</div>

## Overview

**SitePulse** is a production-ready, serverless website uptime monitoring platform. It continuously checks your websites, tracks incidents, records response-time history, and fires instant email alerts when something goes wrong.

| Feature | Details |
|---------|---------|
| ⚡ Automated checks | EventBridge Scheduler triggers every 1–60 min per monitor |
| 📊 Rich dashboard | Live stats, uptime bar, response-time chart |
| 🚨 Instant alerts | AWS SNS email notifications on down + recovery |
| 🔐 Secure | Cognito JWT auth · least-privilege IAM · SSRF protection |
| 📱 Responsive | Mobile-first React SPA with dark theme |
| 🎭 Demo mode | Full UI preview without any AWS account |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              React SPA (Vite)                   │
│    Dashboard │ Monitors │ Incidents │ Alerts    │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS / REST
┌─────────────────▼───────────────────────────────┐
│         API Gateway (REST API)                  │
│  /websites  /checks  /incidents  /dashboard     │
│              Cognito Authorizer                 │
└─────────────────┬───────────────────────────────┘
                  │
       ┌──────────▼──────────┐
       │    AWS Lambda       │
       │  (Node.js 20.x)     │
       └──────────┬──────────┘
                  │
    ┌─────────────┼──────────────┐
    ▼             ▼              ▼
DynamoDB        SNS         EventBridge
(4 tables)   (alerts)    (monitoring cron)
```

### DynamoDB Tables

| Table | Partition Key | Sort Key | Purpose |
|-------|--------------|----------|---------|
| `sitepulse-websites` | `websiteId` | — | Monitor configuration & current status |
| `sitepulse-checks` | `websiteId` | `checkedAt` | Per-check results history |
| `sitepulse-incidents` | `incidentId` | — | Downtime incident records |
| `sitepulse-settings` | `settingId` | — | Notification preferences |

---

## Project Structure

```
SitePulse/
├── frontend/              # React + Vite SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level page components
│   │   ├── layouts/       # AppLayout (sidebar + shell)
│   │   ├── hooks/         # useApi data-fetching hook
│   │   ├── services/      # API layer (real + demo mode)
│   │   ├── data/          # Demo data for preview
│   │   └── utils/         # Date/format helpers
│   ├── .env.example       # Environment variable template
│   └── vite.config.js
│
├── backend/               # AWS Lambda functions (Node.js 20.x)
│   ├── functions/
│   │   ├── websites/      # CRUD monitors API
│   │   ├── checks/        # Check history API
│   │   ├── incidents/     # Incidents API
│   │   ├── dashboard/     # Aggregated stats API
│   │   ├── monitor/       # EventBridge-triggered monitoring engine
│   │   └── notifications/ # SNS subscription management
│   ├── shared/
│   │   ├── dynamodb.js    # DynamoDB Document client
│   │   └── helpers.js     # Response helpers, SSRF validator, auth
│   └── layer/nodejs/      # Lambda Layer dependencies
│
├── infrastructure/
│   └── template.yaml      # AWS SAM template (all resources)
│
└── tests/
    ├── unit/              # Jest unit tests
    └── integration/       # Integration test stubs
```

---

## Quick Start — Demo Mode

No AWS account needed to explore the UI:

```bash
cd frontend
cp .env.example .env.local   # Leave VITE_API_URL empty
npm install
npm run dev
```

Open **http://localhost:5173** — you'll see the full dashboard with sample data.

---

## Deploy to AWS

### Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 20+

### 1 — Install Lambda Layer dependencies

```bash
cd backend/layer/nodejs
npm install
cd ../../..
```

### 2 — Build & Deploy infrastructure

```bash
cd infrastructure
sam build
sam deploy --guided \
  --parameter-overrides \
    AlertEmail=you@example.com \
    Environment=prod
```

Follow the prompts. SAM will output the API Gateway URL when done.

### 3 — Configure frontend

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_API_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/prod
```

### 4 — Run / build frontend

```bash
# Development
npm run dev

# Production build (deploy to S3/CloudFront)
npm run build
```

---

## API Reference

All endpoints require a Cognito JWT in `Authorization: Bearer <token>`.

### Websites

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/websites` | List all monitors |
| `POST` | `/websites` | Add a monitor |
| `GET` | `/websites/{id}` | Get one monitor |
| `PATCH` | `/websites/{id}` | Update interval / enable / disable |
| `DELETE` | `/websites/{id}` | Remove monitor |

### Checks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/websites/{id}/checks` | Check history (paginated) |

### Incidents

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/incidents` | All incidents (paginated) |
| `GET` | `/incidents/{id}` | Single incident |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/stats` | Aggregated stats for user |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/notifications/email` | Subscribe email to SNS alerts |
| `GET` | `/notifications` | List subscriptions |

---

## Security

- **Cognito JWT** authorizer on every API route
- **Per-user data isolation** — all DynamoDB queries filter by `userId` from JWT `sub` claim
- **SSRF protection** — URL validator blocks private/reserved IPs in `shared/helpers.js`
- **Least-privilege IAM** — each Lambda has a dedicated role with minimal permissions
- **DynamoDB PITR** — point-in-time recovery enabled on all tables

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | API Gateway base URL |
| `VITE_USER_POOL_ID` | Optional | Cognito User Pool ID |
| `VITE_USER_POOL_CLIENT_ID` | Optional | Cognito App Client ID |

### Backend (set by SAM template)

| Variable | Description |
|----------|-------------|
| `WEBSITES_TABLE` | DynamoDB table name |
| `CHECKS_TABLE` | DynamoDB checks table |
| `INCIDENTS_TABLE` | DynamoDB incidents table |
| `SETTINGS_TABLE` | DynamoDB settings table |
| `SNS_TOPIC_ARN` | SNS topic for alert notifications |
| `FRONTEND_ORIGIN` | Allowed CORS origin |
| `DEMO_MODE` | Enable demo header auth (`true`/`false`) |
| `REQUEST_TIMEOUT_MS` | HTTP check timeout (default: 10000) |
| `FAILURE_THRESHOLD` | Consecutive failures before alert (default: 2) |

---

## License

MIT — free to use, modify, and deploy.
