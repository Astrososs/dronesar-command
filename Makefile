# SAR Dashboard - Docker Deployment Makefile
# ============================================

.PHONY: help build run stop logs clean rebuild shell \
        vss-build vss-run vss-stop vss-logs \
        full-build full-run full-stop full-logs \
        dev prod env-check

# Default target
help:
	@echo "SAR Dashboard - Docker Commands"
	@echo "================================"
	@echo ""
	@echo "Standalone Deployment:"
	@echo "  make build          - Build standalone Docker image"
	@echo "  make run            - Run standalone container"
	@echo "  make stop           - Stop standalone container"
	@echo "  make logs           - View standalone logs"
	@echo "  make rebuild        - Rebuild and restart standalone"
	@echo ""
	@echo "VSS Integration (connect to existing VSS):"
	@echo "  make vss-build      - Build VSS-integrated image"
	@echo "  make vss-run        - Run with VSS network"
	@echo "  make vss-stop       - Stop VSS-integrated container"
	@echo "  make vss-logs       - View VSS-integrated logs"
	@echo ""
	@echo "Full Stack (dashboard + all VSS services):"
	@echo "  make full-build     - Build full stack"
	@echo "  make full-run       - Run full stack"
	@echo "  make full-stop      - Stop full stack"
	@echo "  make full-logs      - View full stack logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          - Remove all containers and images"
	@echo "  make shell          - Open shell in running container"
	@echo "  make env-check      - Verify environment variables"
	@echo "  make dev            - Run in development mode"

# ============================================
# Environment
# ============================================

ENV_FILE := .env
ifneq (,$(wildcard $(ENV_FILE)))
    include $(ENV_FILE)
    export
endif

SAR_DASHBOARD_PORT ?= 3000
BACKEND_PORT ?= 8000

# ============================================
# Standalone Deployment
# ============================================

build:
	@echo "Building standalone SAR Dashboard..."
	docker compose -f docker-compose.yml build

run:
	@echo "Starting standalone SAR Dashboard on port $(SAR_DASHBOARD_PORT)..."
	docker compose -f docker-compose.yml up -d
	@echo "Dashboard available at http://localhost:$(SAR_DASHBOARD_PORT)"

stop:
	@echo "Stopping standalone SAR Dashboard..."
	docker compose -f docker-compose.yml down

logs:
	docker compose -f docker-compose.yml logs -f

rebuild: stop build run

# ============================================
# VSS Integration Deployment
# ============================================

vss-build:
	@echo "Building VSS-integrated SAR Dashboard..."
	docker compose -f docker-compose.vss.yml build

vss-run:
	@echo "Starting SAR Dashboard with VSS integration..."
	docker compose -f docker-compose.vss.yml up -d
	@echo "Dashboard available at http://localhost:$(SAR_DASHBOARD_PORT)"
	@echo "Connected to VSS backend at port $(BACKEND_PORT)"

vss-stop:
	@echo "Stopping VSS-integrated SAR Dashboard..."
	docker compose -f docker-compose.vss.yml down

vss-logs:
	docker compose -f docker-compose.vss.yml logs -f

vss-rebuild: vss-stop vss-build vss-run

# ============================================
# Full Stack Deployment (Dashboard + VSS)
# ============================================

full-build:
	@echo "Building full stack (Dashboard + VSS services)..."
	docker compose -f compose.vss-integrated.yaml build

full-run:
	@echo "Starting full stack..."
	docker compose -f compose.vss-integrated.yaml up -d
	@echo "Dashboard available at http://localhost:$(SAR_DASHBOARD_PORT)"
	@echo "VSS Backend available at http://localhost:$(BACKEND_PORT)"

full-stop:
	@echo "Stopping full stack..."
	docker compose -f compose.vss-integrated.yaml down

full-logs:
	docker compose -f compose.vss-integrated.yaml logs -f

full-rebuild: full-stop full-build full-run

# Full stack with profiling services
full-run-profiling:
	@echo "Starting full stack with profiling..."
	docker compose -f compose.vss-integrated.yaml --profile perf-profiling up -d

# ============================================
# Utilities
# ============================================

clean:
	@echo "Cleaning up Docker resources..."
	docker compose -f docker-compose.yml down -v --rmi local 2>/dev/null || true
	docker compose -f docker-compose.vss.yml down -v --rmi local 2>/dev/null || true
	docker compose -f compose.vss-integrated.yaml down -v --rmi local 2>/dev/null || true
	@echo "Cleanup complete"

shell:
	docker compose -f docker-compose.yml exec sar-dashboard sh

shell-vss:
	docker compose -f docker-compose.vss.yml exec sar-dashboard sh

env-check:
	@echo "Environment Variables:"
	@echo "  SAR_DASHBOARD_PORT: $(SAR_DASHBOARD_PORT)"
	@echo "  BACKEND_PORT: $(BACKEND_PORT)"
	@echo "  VITE_MAPBOX_ACCESS_TOKEN: $(if $(VITE_MAPBOX_ACCESS_TOKEN),SET,NOT SET)"
	@echo "  VITE_VSS_API_URL: $(VITE_VSS_API_URL)"
	@echo ""
	@if [ -f .env ]; then echo ".env file: EXISTS"; else echo ".env file: NOT FOUND (copy from .env.example)"; fi

dev:
	@echo "Starting development server..."
	npm run dev

# Status check
status:
	@echo "Container Status:"
	@docker compose -f docker-compose.yml ps 2>/dev/null || echo "Standalone: Not running"
	@docker compose -f docker-compose.vss.yml ps 2>/dev/null || echo "VSS Integration: Not running"
	@docker compose -f compose.vss-integrated.yaml ps 2>/dev/null || echo "Full Stack: Not running"

# Health check
health:
	@echo "Health Check:"
	@curl -s -o /dev/null -w "Dashboard: %{http_code}\n" http://localhost:$(SAR_DASHBOARD_PORT)/ || echo "Dashboard: Not responding"
	@curl -s -o /dev/null -w "VSS Backend: %{http_code}\n" http://localhost:$(BACKEND_PORT)/health || echo "VSS Backend: Not responding"
