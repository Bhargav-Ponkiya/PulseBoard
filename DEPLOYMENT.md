# PulseBoard Deployment Guide

This guide covers deploying the PulseBoard monorepo to Render (Backend/Microservices) and Vercel (Frontend) using free-tier services.

## Step 1: Database Setup (Free Tier Alternatives)

Before deploying the code, you must set up the external dependencies.

### 1. PostgreSQL (Neon)
- Go to [Neon.tech](https://neon.tech/) and create a free project named "pulseboard".
- Copy the connection string (`postgres://...`).
- Run initial migration against this new remote database:
  ```bash
  DATABASE_URL=your_neon_connection_string npm run typeorm migration:run -- -d libs/database/src/data-source.ts
  ```

### 2. MongoDB (Atlas)
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create an M0 free cluster.
- Create a database named `pulseboard`.
- In Network Access, whitelist `0.0.0.0/0` (Allow access from anywhere — required for Render).
- Create a Vector Search index on `logs.embedding`. Use the Atlas UI -> Search -> Create Search Index -> JSON Editor:
  ```json
  {
    "mappings": {
      "dynamic": true,
      "fields": {
        "embedding": {
          "dimensions": 768,
          "similarity": "cosine",
          "type": "knnVector"
        }
      }
    }
  }
  ```
- Copy the Connection String (URI).

### 3. Redis (Upstash)
- Go to [Upstash](https://upstash.com/) and create a Redis database.
- Copy the **Redis URL** (ensure it's in the `rediss://` or `redis://` format).

### 4. RabbitMQ (CloudAMQP)
- Go to [CloudAMQP](https://www.cloudamqp.com/) and create a "Little Lemur" (free tier) instance.
- Copy the AMQP URL (`amqps://...`). Note that CloudAMQP's free tier has a 1-connection limit, so ensure your services multiplex channels correctly (this is handled by `@golevelup/nestjs-rabbitmq` if configured to share connections, but beware of limits if scaling).

---

## Step 2: Render Deployment

We use `render.yaml` (Infrastructure as Code) to deploy the 4 microservices on Render's free tier.

1. Create a Render account and connect your GitHub repository.
2. In the Render Dashboard, click **New +** > **Blueprint**.
3. Select your GitHub repository for PulseBoard.
4. Render will automatically detect the `render.yaml` file in the root.
5. Provide the required environment variables when prompted (these map to `pulseboard-env`):
   - `DATABASE_URL` (Neon)
   - `MONGODB_URI` (Atlas)
   - `REDIS_URL` (Upstash)
   - `RABBITMQ_URL` (CloudAMQP)
   - `API_GATEWAY_URL` (You will need to update this after the gateway deploys, e.g., `https://pulseboard-api-gateway.onrender.com`)
   - `FRONTEND_URL` (e.g., `https://pulseboard.vercel.app`)
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
   *(Internal secrets and JWT secrets are generated automatically per the blueprint).*
6. Click **Apply**. Render will start deploying the 4 services.
7. Note down the service URLs after deployment.

---

## Step 3: Keep-Alive Cron (IMPORTANT)

Render's free tier spins down web services after 15 minutes of inactivity. Since you have background polling and consuming tasks, they **must not spin down**.

Use a free service like [cron-job.org](https://cron-job.org) to ping your services:
1. Create an account on cron-job.org.
2. Create 4 separate cron jobs (one for each service).
3. **Configuration**:
   - **URL**: `https://pulseboard-api-gateway.onrender.com/health` (repeat for poller, ingestor, and alert services).
   - **Schedule**: `*/10 * * * *` (every 10 minutes).
   - **Method**: GET.
   - **Expected status**: 200.

This will keep your services awake permanently.

---

## Step 4: Vercel Frontend Deployment

1. Go to [Vercel](https://vercel.com/) and connect your GitHub repository.
2. Import the `frontend` folder (set the Root Directory to `frontend`).
3. Set the Environment Variable:
   - `NEXT_PUBLIC_API_URL` = (Your Render API Gateway URL, e.g., `https://pulseboard-api-gateway.onrender.com`)
4. Click **Deploy**.
5. Once deployed, take the resulting Vercel URL and update the `FRONTEND_URL` environment variable in your Render dashboard (in the Env Group) to ensure CORS works correctly.
