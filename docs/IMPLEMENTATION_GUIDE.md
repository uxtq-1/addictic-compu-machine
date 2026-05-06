# Cafeteria Lite Professional - Implementation Guide

## Project Overview

**Cafeteria Lite Professional** is a SaaS platform for small cafeterias to manage their operations, products, sales, and inventory. This guide covers the Phase 0 foundation implementation.

## Phase 0: Foundation Complete ✅

### What's Been Set Up

#### Backend Infrastructure
- **Node.js + Express + TypeScript** backend with modern development setup
- **PostgreSQL** database on Google Cloud SQL
- **Firebase Authentication** for user management with JWT token support
- **Environment configuration** with Secret Manager integration
- **Comprehensive logging** with Winston
- **Audit logging middleware** that captures all mutations
- **Security middleware**: rate limiting, CORS, helmet, input validation
- **Error handling** framework

#### Database Schema
- **Users & Roles** - RBAC with Admin, Staff, Cashier, Owner roles
- **Cafeteria Profiles** - Multi-tenant support (1 cafeteria per owner per tier)
- **Products & Categories** - Menu management with images, pricing, VAT
- **Orders & Inventory** - Order management with stock tracking
- **Invoices & Payments** - Stripe integration ready
- **Audit Logs** - Complete audit trail for compliance
- **Reports** - Daily summaries, analytics

#### Infrastructure as Code
- **Terraform** for IaC: Cloud SQL, Cloud Run, VPC, IAM, Storage
- **GitHub Actions** CI/CD pipeline with auto-deploy to staging
- **Docker** containerization for Cloud Run deployment

#### Security Built-In
- Secret Manager for credentials
- JWT authentication
- Role-based access control (RBAC)
- Audit logging from day 1
- Input validation and sanitization
- Rate limiting
- PCI DSS aligned (no card storage, Stripe-only)

### Directory Structure

```
addictic-compu-machine/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Main entry point
│   │   ├── middleware/        # Auth, audit, error handling
│   │   ├── routes/            # API endpoints (Phase 1+)
│   │   ├── models/            # Data models (Phase 1+)
│   │   ├── services/          # Business logic (Phase 1+)
│   │   └── utils/             # Helpers, DB, logging
│   ├── migrations/            # Database schema versions
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── frontend-web/              # React admin dashboard (Phase 1+)
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── frontend-mobile/           # Flutter POS app (Phase 5)
├── terraform/                 # IaC for GCP
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars.example
├── docs/                      # Documentation
└── .github/workflows/         # CI/CD pipelines

```

## Next Steps: Phase 1 (Weeks 3-5)

Phase 1 focuses on core product management and storefront:

### Week 3: Product API & Backend Core
1. Build product management endpoints (CRUD)
2. Implement product image upload to Firebase Storage
3. Create product categories API
4. Build cafeteria profile endpoints
5. Write unit tests for business logic

Key files to create:
- `backend/src/routes/products.ts`
- `backend/src/services/ProductService.ts`
- `backend/src/services/StorageService.ts`
- `backend/src/models/Product.ts`

### Week 4: Web Admin Dashboard
1. Set up React frontend with TypeScript
2. Build login page (Firebase Auth integration)
3. Create admin dashboard home
4. Build products management page (list, add, edit, delete)
5. Add image upload functionality
6. Implement product category management

### Week 5: Storefront Frontend
1. Build public storefront (customer view)
2. Product browsing by category
3. Product search
4. Shopping cart logic
5. Deploy Phase 1 to staging

## Development Workflow

### 1. Local Setup

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (separate terminal)
cd frontend-web
npm install
npm run dev

# Prefix: DB migrations (one-time only)
cd backend
npm run migrate
```

### 2. Environment Setup

```bash
# Copy example files
cp backend/.env.example backend/.env
cp terraform/terraform.tfvars.example terraform/terraform.tfvars

# Fill in your values:
# - GCP Project ID
# - Firebase credentials
# - Stripe keys (test vs prod)
```

### 3. Database Migrations

```bash
# Create new migration
knex migrate:make migration_name --knexfile backend/knexfile.js

# Run migrations
knex migrate:latest --knexfile backend/knexfile.js

# Rollback
knex migrate:rollback --knexfile backend/knexfile.js
```

### 4. Deployment

```bash
# Local Docker build
docker build -t cafeteria-lite-api:latest backend/

# Deploy to Cloud Run (via GitHub Actions on main branch)
git push origin main
# GitHub Actions will build, test, and deploy to staging automatically
```

## API Design Principles

All APIs follow these patterns:

### Successful Response
```json
{
  "success": true,
  "data": { "id": "...", ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Product name is required",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Authentication
All protected endpoints require JWT token in `Authorization: Bearer <token>` header

### Pagination (for list endpoints)
```
GET /products?page=1&limit=20&sort=created_at&order=desc
```

## Testing Strategy

### Unit Tests (Jest)
```bash
npm test
npm test -- --watch
npm test -- --coverage
```

### Integration Tests
- Test full workflows: create product → upload image → display in storefront
- Test auth: login → JWT generation → API access

### E2E Tests (Phase 2+)
- Test customer journey: browse → cart → checkout

## Monitoring & Logging

All events are logged to Cloud Logging:
- Login events (user, timestamp, IP)
- API requests (endpoint, latency, status)
- Error events (stack trace, user context)
- Database queries (performance)
- Business events (order created, payment received)

View logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cafeteria-lite-api-staging" \
  --limit 50 --format json
```

## Security Checklist (Pre-Launch)

- [ ] All secrets in Secret Manager, never in code
- [ ] Stripe keys only used on backend
- [ ] JWT secret rotated on deploy
- [ ] Database encrypted at rest
- [ ] All network traffic HTTPS
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] CORS restricted to known domains
- [ ] Audit logs for all mutations
- [ ] No PII in logs
- [ ] MFA optional for owner

## Support & Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Verify Cloud SQL instance is running
- Check VPC Connector configuration
- Verify Cloud Run service account has `cloudsql.client` role

**"Stripe webhook signature verification failed"**
- Verify webhook endpoint URL in Stripe dashboard
- Check webhook secret matches environment variable
- Confirm Stripe test vs production keys are correct

**"Firebase auth token invalid"**
- Verify Firebase project ID matches
- Check JWT secret in Secret Manager
- Confirm token not expired (7 days)

## Cost Estimates (Monthly, Staging)

- Cloud SQL (db-f1-micro): ~$10
- Cloud Run (512MB, 1 CPU): ~$20
- Cloud Storage (images): ~$5
- Secret Manager: Free (first 6 secrets)
- **Total: ~$35/month staging**

Production (with redundancy) would be 2-3x higher.

## Next Phase

After Phase 0:
1. Implement Phase 1 (Product Management)
2. Add comprehensive tests
3. Soft launch to 1 real cafeteria for feedback
4. Iterate based on user feedback
5. Add Phase 2 (Payments & Orders)

---

**Questions?** Check the docs folder for detailed API specs and architecture diagrams.
