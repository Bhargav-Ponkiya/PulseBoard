.PHONY: up down logs ps clean
.PHONY: backend frontend stop-backend dev restart-backend

# Docker infra
up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

clean:
	docker compose down -v

reset-rabbitmq:
	docker compose stop rabbitmq
	docker compose rm -f rabbitmq
	docker volume rm pulseboard_rabbitmq_data 2>/dev/null || true
	docker compose up -d rabbitmq

# Backend services
backend:
	npm run start:backend

stop-backend:
	npm run stop:backend

restart-backend:
	npm run restart:backend

# Frontend
frontend:
	npm run start:frontend

# Everything
dev:
	npm run dev

# Migration
db-migrate:
	nest start api-gateway

db-generate:
	@echo "Run: npx typeorm migration:generate -d libs/database/src/data-source.ts libs/database/src/migrations/$(name)"

# Deployment
deploy-all:
	@echo "Make sure Render CLI is installed and authenticated."
	render deploy pulseboard-api-gateway
	render deploy pulseboard-poller-service
	render deploy pulseboard-ingestor-service
	render deploy pulseboard-alert-service

logs-api:
	render logs pulseboard-api-gateway
