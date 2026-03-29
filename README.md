# Iraq Business Data Agents – 18 City Scrapers + Quality Control

## Features
- 18 independent agents, one per Iraqi city
- Real data from Google Places API + Gemini AI enrichment
- Quality control manager scores each business (0-100)
- Dashboard to run any agent individually or all 18 at once
- Live WebSocket logs

## Project Structure

```text
18-AGENTS/
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── agents/
│   │   │   ├── CityAgent.ts
│   │   │   ├── QualityManager.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── gemini.ts
│   │   │   └── googlePlaces.ts
│   │   ├── types.ts
│   │   └── queue.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── dashboard/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── supabase/
│   └── migrations/
│       └── 001_agent_schema.sql
├── docker-compose.yml
└── README.md
```

## Quick Start

### 1. Prerequisites
- Node.js 18+
- Redis (or Docker)
- Supabase account
- Google Places API key
- Gemini API key

### 2. Setup Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 3. Setup Frontend
```bash
cd dashboard
npm install
npm run dev
```

### 4. Database
Run `supabase/migrations/001_agent_schema.sql` in Supabase SQL Editor.

### 5. Run Redis (if needed)
```bash
docker-compose up -d redis
```

## API Endpoints
- `GET /api/agents/status` – List agent jobs
- `POST /api/agents/start` – Start one city agent
- `POST /api/agents/start-all` – Start all 18 agents
- `GET /api/agents/logs/:jobId` – Fetch job logs

## WebSocket
- Connect to `ws://localhost:3001/ws` for live logs.

## License
MIT
