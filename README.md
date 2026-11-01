# SitePulse ⚡

> **Serverless website uptime monitoring — built on AWS, runs in your browser.**

SitePulse watches your websites every minute, records response times, opens incidents when things go down, and fires instant email alerts so you know before your users do.

## Live Demo

Run the app locally in demo mode — no AWS account needed:

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

The UI loads with realistic sample data so you can explore every feature.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Vite · Vanilla CSS · Recharts · Lucide |
| Backend | AWS Lambda (Node.js 20.x) · API Gateway |
| Database | DynamoDB (4 tables, pay-per-request) |
| Scheduler | EventBridge Scheduler (per-minute cron) |
| Alerts | AWS SNS (email subscriptions) |
| Auth | Amazon Cognito User Pools |
| IaC | AWS SAM (CloudFormation) |

## Features

- 🔴/🟢 **Real-time status** — UP / DOWN / DEGRADED / UNKNOWN per monitor
- 📊 **90-slot uptime bar** — visual check history at a glance  
- 📈 **Response-time chart** — area chart over last 48 hours
- 🚨 **Incident tracking** — automatic open/resolve with duration
- 📧 **Email alerts** — SNS-powered with deduplication
- 🎭 **Demo mode** — full UI preview with zero backend
- 📱 **Mobile responsive** — sidebar collapses to hamburger on small screens
- 🔐 **Secure by design** — Cognito JWT, per-user data isolation, SSRF protection

## Project Layout

```
SitePulse/
├── frontend/        React SPA
├── backend/         Lambda functions + shared utilities
├── infrastructure/  AWS SAM template
├── tests/           Unit + integration tests
└── docs/            Full documentation
```

See [`docs/README.md`](docs/README.md) for the full deploy guide, API reference, and architecture details.

## 🚀 Live Demo

[Open SitePulse](https://d2y8a0076i820k.cloudfront.net)

## License

MIT
