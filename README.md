# Verdant

Verdant is a multi-agent supply chain management system for monitoring suppliers, ports, routes, and SKUs across a distributed logistics network. It combines a Node.js API backend, a React dashboard, agent-based decision logic, and persistence for operational data.

## Overview

This repository contains the core backend and supporting services for an AI-driven supply chain command center:

- Express API server for decisioning, memory, auth, replay, and health endpoints
- PostgreSQL-backed world model and operational data
- Multi-agent orchestration for supplier, route, and port intelligence
- React frontend for command-center monitoring and control
- Security service for auth and protected access patterns

## Architecture

```text
Verdant/
├── agents/              # Agent definitions and logic
├── data/                # Data inputs and reference datasets
├── db/                  # Database client and schema helpers
├── frontend/            # React + Vite dashboard UI
├── lib/                 # Shared libraries and utilities
├── memory/              # Memory and state management
├── middleware/           # API middleware, auth, validation
├── routes/              # HTTP route handlers
├── security/            # Security/auth server and related code
├── world/               # Shared world model and state snapshots
├── .env.example         # Example environment configuration
├── package.json         # Root backend dependencies and scripts
├── server.js            # Main backend server
├── test_all.js          # End-to-end smoke checks
├── test_connection.js   # Database / service connectivity tests
├── README.md            # Project documentation
└── ...
```

## Features

- Supplier and route risk monitoring
- Port status visibility and updates
- SKU / inventory awareness from the shared world model
- Agent-driven decision support and operational replay
- Authentication and secure API patterns
- WebSocket connection support for real-time updates
- Browser-based dashboard for operational oversight

## Tech Stack

- Node.js
- Express
- PostgreSQL
- React + Vite
- WebSockets (`ws`)
- JWT-based auth
- Helmet, rate limiting, and cookie-based protections

## Prerequisites

Before running the project, install:

- Node.js 18+ or newer
- PostgreSQL database
- npm

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Then populate the values as needed:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=supply_chain
PG_USER=postgres
PG_PASSWORD=your_postgres_password_here
PORT=3001
JWT_SECRET=your_jwt_secret_here
```

## Install Dependencies

From the repository root:

```bash
npm install
```

If you also want to run the frontend dashboard:

```bash
cd frontend
npm install
```

## Run the Application

Start the main backend:

```bash
node server.js
```

Or using the project root environment and process manager setup if configured in your local workflow.

Start the frontend in a separate terminal:

```bash
cd frontend
npm run dev
```

The backend exposes health and API endpoints, including:

- `http://localhost:3001/health`
- `ws://localhost:3001`

## Key Backend Entry Points

- `server.js` — starts the main Express API and WebSocket service
- `world/worldModel.js` — loads and serves shared operational state
- `routes/` — operational API endpoints for auth, status, decisions, memory, replay, and HITL flows
- `db/` — PostgreSQL connection and data access helpers

## Notes

This repository includes both a core supply-chain backend and a separate security-focused service under `security/`. The main project is centered around a supply-chain command-center model, while the security folder contains additional authentication and inspection logic.

## License

This project does not currently declare a repository license in the root package metadata. If you plan to publish or distribute the project, add an explicit license file and update project metadata accordingly.

## Development Notes

- Ensure your PostgreSQL database is running and configured before starting the backend.
- Review the `.env.example` file and confirm all required values are set.
- For frontend development, the Vite dashboard is served from `frontend/` and is separate from the root backend server.

## Repository Signals

This repository is described as:

> Multi Agent supply chain management system

It is primarily JavaScript-based and organized around a backend-driven orchestration model with an operational dashboard and agent decision support.
