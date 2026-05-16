# PulseBoard — OpenCode Agent Context
> This file is automatically read by OpenCode before every prompt.
> It gives the AI full context about the project so you never repeat yourself.

---

## PROJECT IDENTITY

**Name:** PulseBoard
**Type:** AI-powered observability microservices platform
**Architecture:** NestJS Monorepo (4 microservices) + Next.js 14 frontend
**Stage:** Local development (Docker for all infra)

---

## ABSOLUTE RULES — NEVER VIOLATE THESE

1. **Generate COMPLETE files** — never partial snippets, never "// rest of code here"
2. **Never use `process.env` directly** — always use `ConfigService` from `@nestjs/config`
3. **All DTOs must use class-validator** — `whitelist: true, forbidNonWhitelisted: true`
4. **UUIDs for all primary keys** — `@PrimaryGeneratedColumn('uuid')`
5. **Async/await only** — never callbacks, never `.then()` chains
6. **All errors use NestJS exceptions** — `NotFoundException`, `ForbiddenException`, etc.
7. **No `any` type in TypeScript** — always explicit types or generics
8. **Every service method must have JSDoc** — one-line description minimum
9. **No hardcoded values** — ports, URLs, secrets always come from ConfigService
10. **Test after each file** — if something breaks, fix it before generating the next file

---

## MONOREPO STRUCTURE

```
pulseboard/
├── apps/
│   ├── api-gateway/        # Port 3001 — REST API, Auth, SSE, CRUD
│   ├── poller-service/     # Port 3002 — HTTP pings, RabbitMQ publisher
│   ├── ingestor-service/   # Port 3003 — MongoDB writes, embeddings
│   └── alert-service/      # Port 3004 — AI reports, webhooks
├── libs/
│   ├── common/             # Shared DTOs, interfaces, enums, guards, decorators
│   ├── database/           # TypeORM entities + Mongoose schemas
│   ├── rabbitmq/           # RabbitMQ module + constants
│   └── logger/             # Pino logger config
├── AGENTS.md               # This file
├── docker-compose.yml      # Local infra
├── nest-cli.json
└── package.json
```

---

## LOCAL INFRASTRUCTURE (Docker — No Cloud Accounts Needed)

All infrastructure runs locally via Docker Compose. Use these connection strings in .env files:

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pulseboard

# MongoDB
MONGODB_URI=mongodb://admin:password@localhost:27017/pulseboard?authSource=admin

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT (local dev values — change before deploy)
JWT_SECRET=local_dev_jwt_secret_minimum_32_characters_long
JWT_REFRESH_SECRET=local_dev_refresh_secret_minimum_32_chars
ENCRYPTION_KEY=local_dev_encryption_key_32chars!!

# Internal service auth
INTERNAL_SECRET=local_dev_internal_secret

# Service URLs (local)
API_GATEWAY_URL=http://localhost:3001
POLLER_SERVICE_URL=http://localhost:3002
INGESTOR_SERVICE_URL=http://localhost:3003
ALERT_SERVICE_URL=http://localhost:3004
FRONTEND_URL=http://localhost:3000

# Ports
PORT=3001  # override per service
```

**AI Keys (needed even locally):**
```env
GEMINI_API_KEY=        # Get free from aistudio.google.com — no CC needed
GROQ_API_KEY=          # Get free from console.groq.com — no CC needed
```

---

## TECH STACK

### Backend
- **NestJS 10** + **TypeScript 5**
- **TypeORM 0.3** — PostgreSQL ORM
- **Mongoose 8** — MongoDB ODM
- **@golevelup/nestjs-rabbitmq** — RabbitMQ client
- **ioredis** — Redis client
- **@nestjs/schedule** + **SchedulerRegistry** — dynamic cron jobs
- **@ai-sdk/google** + **ai** (Vercel AI SDK) — Gemini integration
- **@ai-sdk/groq** — Groq fallback
- **@octokit/rest** — GitHub API
- **axios** — HTTP pings in Poller
- **bcryptjs** — password hashing
- **nestjs-pino** — structured logging

### Frontend
- **Next.js 14 App Router**
- **Tailwind CSS** + **shadcn/ui** (dark theme)
- **Recharts** — latency/uptime charts
- **Zustand** — auth state
- **EventSource API** — SSE for live dashboard
- **date-fns** — date formatting

---

## DATABASE SCHEMAS SUMMARY

### PostgreSQL (TypeORM entities in libs/database/src/entities/)
- **users** — id, email, passwordHash, name, githubAccessToken(encrypted), refreshTokenHash
- **projects** — id, userId, name, slug, githubRepo, apiKey
- **monitors** — id, projectId, name, url, type, intervalSeconds, expectedStatus, timeoutMs, isActive, currentStatus
- **incidents** — id, monitorId, projectId, status, startedAt, resolvedAt, aiReport, rootCause, githubCommits(jsonb), affectedLogs(jsonb)
- **alert_channels** — id, projectId, name, type(discord/slack/webhook), webhookUrl, isActive

### MongoDB (Mongoose schemas in libs/database/src/schemas/)
- **metrics** — monitorId, projectId, status, statusCode, latencyMs, errorCode, timestamp (TTL 7 days)
- **logs** — projectId, level, message, metadata(mixed), embedding(number[768]), timestamp (TTL 14 days)

---

## RABBITMQ DESIGN

```
EXCHANGES:
  pulse.config    → fanout  → poller.config.q       (monitor CRUD broadcasts)
  pulse.telemetry → topic   → ingestor.metric.q     (metric.raw)
                           → ingestor.log.q         (log.raw)
  pulse.events    → topic   → alerter.incident.q    (incident.trigger, incident.resolved)
  pulse.dlx       → direct  → dlq.general           (dead letters)

ROUTING KEYS:
  metric.raw          poller → ingestor (ping results)
  log.raw             ingestor HTTP → ingestor consumer (user app logs)
  incident.trigger    poller → alert-service (site DOWN)
  incident.resolved   poller → alert-service (site back UP)
  monitor.config      api-gateway → ALL pollers (fanout)
```

---

## REDIS KEY PATTERNS

```
incident:active:{monitorId}        EX 300    Debounce — SETNX only
monitor:status:{monitorId}         EX 120    Current UP/DOWN cache
cache:github:{owner}:{repo}        EX 600    GitHub commits cache
rate:ingest:logs:{projectId}       EX 60     Rate limit counter
apikey:valid:{sha256hash}          EX 300    API key validation cache
live:stream:{projectId}            pub/sub   SSE real-time events
```

---

## SERVICE RESPONSIBILITIES

### API Gateway (3001)
- Auth (register, login, refresh, logout)
- CRUD: projects, monitors, alert_channels
- Query: incidents, metrics summary, logs
- SSE: `/sse/live?projectId=xxx` — Redis sub → client stream
- Internal endpoints: `/internal/*` — for other services (X-Internal-Secret header)

### Poller Service (3002)
- Loads all active monitors on startup via HTTP to API Gateway internal endpoint
- Dynamic cron per monitor using SchedulerRegistry
- Pings URL with axios, measures latency
- Publishes metric.raw to RabbitMQ every ping
- SETNX debounce on DOWN → publishes incident.trigger ONCE
- Listens to pulse.config fanout for monitor changes

### Ingestor Service (3003)
- Consumes metric.raw → batch writes to MongoDB (buffer 50 items or 500ms)
- Consumes log.raw → writes log + async generates embedding
- Exposes POST /ingest/metrics and POST /ingest/logs (API key auth)
- Rate limiting on ingest endpoints
- Publishes to Redis pub/sub live:stream:{projectId} after each metric write

### Alert Service (3004)
- Consumes incident.trigger
- Fetches: last 5 error logs (MongoDB) + last 3 GitHub commits (Octokit + Redis cache)
- Calls Gemini 2.5 Flash → generates JSON incident report
- Falls back to Groq (Llama 4) if Gemini fails
- Saves incident to PostgreSQL
- Dispatches to all active Discord/Slack/webhook channels
- Consumes incident.resolved → marks incident resolved

---

## AI INTEGRATION

### Gemini (Primary)
- Model: `gemini-2.5-flash` via `@ai-sdk/google`
- Incident reports: `generateText()` with JSON output instruction
- Embeddings: `text-embedding-004` via `embed()` — 768 dimensions
- Free tier: ~500 req/day — sufficient for local dev

### Groq (Fallback)
- Model: `llama-4-scout-17b-16e-instruct` (or latest free model)
- Used when Gemini quota exhausted or errors
- Same Vercel AI SDK interface — just change provider import

### AI Response Safety
```typescript
// Always parse AI JSON safely
const cleaned = text.replace(/```json|```/g, '').trim();
try {
  return JSON.parse(cleaned);
} catch {
  return { probable_cause: text, evidence: [], immediate_fix: 'Manual review needed', severity: 'medium' };
}
```

---

## CURRENT BUILD PHASE

**Phase:** Local Development
**Infrastructure:** Docker Compose (postgres, mongodb, redis, rabbitmq)
**No cloud accounts needed yet**
**AI APIs needed:** Only Gemini + Groq keys (free, no CC)

### Build Order
1. Monorepo setup + Docker Compose
2. Shared libraries (common, database, rabbitmq, logger)
3. API Gateway (auth + CRUD)
4. Poller Service
5. Ingestor Service
6. Alert Service
7. Next.js Frontend
8. Integration testing
9. (Later) Cloud deployment

---

## WHEN GENERATING CODE — CHECKLIST

Before outputting any file, verify:
- [ ] Complete file — no TODOs, no partial implementations
- [ ] Imports are correct and match the monorepo path aliases (@app/common, etc.)
- [ ] ConfigService used for all env vars
- [ ] class-validator decorators on all DTOs
- [ ] Error handling with proper NestJS exceptions
- [ ] No `any` types
- [ ] Exported correctly (module exports, barrel files)
