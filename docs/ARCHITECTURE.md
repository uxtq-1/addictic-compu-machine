# Cafeteria Lite Professional - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  React Web             │  Flutter Mobile         │  Public    │
│  (Admin Dashboard)     │  (Cashier POS)          │  Storefront│
│  localhost:3001        │  Mobile App             │ localhost: │
└──────────┬─────────────┴────────┬────────────────┴────────16──┘
           │                      │                     │
           │      HTTPS/WSS       │                  HTTPS
           ▼                      ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway / Cloud Run                     │
├─────────────────────────────────────────────────────────────┤
│  Routing │ Rate Limiting │ CORS │ Security Headers           │
└──────────┬────────────────────────────────────────────────┬──┘
           │                                                │
           ▼                                                ▼
┌─────────────────────────────────────┐  ┌────────────────────┐
│      Backend Services               │  │ External Services  │
├─────────────────────────────────────┤  ├────────────────────┤
│  Auth Service (Firebase)            │  │ Stripe             │
│  Product Service                    │  │ SendGrid (Email)   │
│  Order Service                      │  │ Firebase Storage   │
│  Payment Service (Stripe Webhook)   │  │ Google Secret Mgr  │
│  Invoice Service                    │  │ Cloud Logging      │
│  Report Service                     │  └────────────────────┘
│  Audit Service                      │
│  Inventory Service                  │
└──────────┬────────────────────────┬─┘
           │                        │
           ▼                        ▼
┌─────────────────────┐    ┌──────────────────────┐
│  PostgreSQL DB      │    │  Firebase Storage    │
│  (Cloud SQL)        │    │  (Product Images)    │
│                     │    │                      │
│ Tables:             │    │ Path:                │
│ - users             │    │ cafeterias/{id}/     │
│ - products          │    │ products/{id}/       │
│ - orders            │    │                      │
│ - invoices          │    │                      │
│ - audit_logs        │    │                      │
│ - inventory         │    │                      │
│ - reports           │    │                      │
└─────────────────────┘    └──────────────────────┘

┌──────────────────────────────────────┐
│  Background Jobs (Bull Queue)        │
├──────────────────────────────────────┤
│  - Generate daily reports 11 PM      │
│  - Email invoice delivery            │
│  - Inventory cleanup                 │
│  - Payment reminders                 │
└──────────────────────────────────────┘
```

## Technology Stack

| Layer         | Technology       | Purpose                        |
|---------------|------------------|--------------------------------|
| **Frontend**  | React 18         | Admin web dashboard           |
|               | TypeScript       | Type safety                   |
|               | Vite             | Fast dev build                |
|               | Zustand          | State management              |
| **Mobile**    | Flutter          | Cross-platform POS            |
| **Backend**   | Node.js 20       | Runtime                       |
|               | Express          | Web framework                 |
|               | TypeScript       | Type safety                   |
|               | Knex.js          | DB migrations                 |
| **Database**  | PostgreSQL 16    | Relational data               |
|               | Redis            | Caching & job queue           |
| **Auth**      | Firebase Auth    | User authentication           |
|               | JWT              | API token generation          |
| **Storage**   | Firebase Storage | Product images                |
|               | Cloud Storage    | PDFs, reports (alternative)   |
| **Payments**  | Stripe           | Payment processing            |
| **Email**     | SendGrid         | Transactional emails          |
| **Hosting**   | Cloud Run        | Managed container platform    |
|               | Cloud SQL        | Managed PostgreSQL            |
| **Monitoring**| Cloud Logging    | Centralized logging           |
|               | Cloud Trace      | Distributed tracing           |
| **IaC**       | Terraform        | Infrastructure provisioning   |
| **CI/CD**     | GitHub Actions   | Automated deployment          |

## Data Flow

### New Order Flow
```
1. Customer browses storefront (frontend-web)
2. Selects products, adds to cart (stored in localStorage + DB)
3. Enters email, order type, notes
4. Clicks "Pay Now" → Stripe checkout session created
5. Stripe returns Checkout URL
6. Customer enters payment details on Stripe-hosted page
7. Payment processed
8. Stripe sends webhook to /webhooks/stripe
9. Backend verifies webhook signature
10. Order marked as "paid" in DB
11. Inventory auto-decremented
12. Email confirmation sent to customer
13. Real-time notification to owner (WebSocket)
14. Owner sees new order in dashboard
15. Owner marks as "preparing" → "ready" → "completed"
16. Invoice auto-generated and sent to customer
```

### Daily Report Flow
```
1. Cloud Scheduler triggers at 11 PM
2. ReportService.generateDailyReport(cafeteria_id)
3. Queries all orders from today
4. Calculates metrics: revenue, VAT, top products, low stock
5. Generates HTML report
6. Sends email to owner with summary + attachments
7. Stores report in DB for historical view
```

## Security Model

### Authentication
- Users sign up via Firebase Auth
- Firebase returns ID token
- Frontend stores token in localStorage (httpOnly cookie in production)
- Every API request includes: `Authorization: Bearer <id_token>`
- Backend verifies token with Firebase
- Custom JWT includes: cafeteria_id, role, permissions

### Authorization (RBAC)
- Owner: full access to cafeteria, billing, user management
- Admin: can manage products, orders, inventory, can view reports
- Staff: can view orders, update status, view inventory
- Cashier: can process sales on POS screen only

### Data Isolation (Multi-Tenancy)
- All queries filtered by `cafeteria_id`
- User can only access their cafeteria's data
- Stripe customer ID linked to cafeteria
- Database indexes on (`cafeteria_id`, other_field)

### Secrets Management
- All secrets in Google Secret Manager
- Cloud Run service account has permission to read secrets
- Secrets rotated quarterly
- Audit log captures all secret access attempts

### PCI DSS Compliance
- No credit card data stored anywhere
- All payments via Stripe (PCI DSS L1)
- Webhook endpoint validates signature (prevents spoofing)
- No card data in logs or error messages
- Timeout on sessions
- Optional MFA for owner

## Database Schema

### Core Tables
- `users` - User accounts with roles
- `cafeteria_profiles` - Business info, settings
- `subscriptions` - Plan, limits, billing
- `products` - Menu items
- `orders` - Customer orders
- `order_items` - Line items in orders
- `invoices` - Generated invoices
- `payments` - Stripe payment records
- `inventory` - Stock levels
- `audit_logs` - All mutations
- `reports` - Daily analytics

### Relationships
```
User → Cafeteria Profile (1:1 owner, M:1 many staff)
Cafeteria → Products (1:M)
Cafeteria → Orders (1:M)
Order → Order Items (1:M)
Order → Invoice (1:1)
Order → Payment (1:1)
Product → Inventory (1:1)
```

## Performance Optimizations

### Database
- Indexes on frequently queried columns: `cafeteria_id`, `created_at`, `order_status`
- Connection pooling: min 2, max 10 connections
- Query logging to identify slow queries
- Partitioning audit logs by date (after 1 year, moving old logs to archive)

### Caching
- Redis for session tokens (optional for scale)
- HTTP cache headers for static assets (images, JS bundles)
- Product list cache invalidated on update

### Frontend
- Code splitting with Vite
- Image optimization (WebP, lazy loading)
- State management with Zustand (lightweight vs Redux)

### API
- Pagination for list endpoints (default 20 items)
- Response compression (gzip)
- API versioning (/v1/, /v2/) for future updates

## Monitoring & Observability

### Logging
- All requests logged to Cloud Logging
- Structured JSON logs with context (user_id, cafeteria_id, request_id)
- Log levels: debug, info, warn, error
- Sensitive data redacted (passwords, tokens)
- Retention: 30 days live, 1 year archived

### Metrics
- Request count by endpoint
- Request latency (p50, p95, p99)
- Error rate by type
- Database connection pool usage
- Stripe webhook success rate

### Alerting
- Alert: error rate > 5% for 5 minutes
- Alert: API latency p99 > 1000ms
- Alert: database connection pool exhausted
- Alert: failed webhook signature verification
- Alert: low disk space on Cloud SQL

### Tracing
- Distributed trace for each request
- Trace includes: auth, DB query, external API calls
- Identify bottlenecks and optimize

## Disaster Recovery

### Backup Strategy
- CloudSQL automated daily backups (7-day retention)
- Point-in-time recovery enabled
- Test restore procedure monthly

### Failover
- Cloud Run auto-scales across zones
- Database has regional failover
- Secrets stored in multi-region

### Data Loss Prevention
- Audit logs immutable (append-only)
- Order data never deleted (soft delete: `deleted_at` timestamp)
- Invoice PDFs stored permanently in Cloud Storage

## Scaling

### Horizontal Scaling
- Cloud Run auto-scales to 100 instances
- Load balanced across instances
- Stateless design (all state in DB or Redis)

### Vertical Scaling
- Cloud Run memory: 512MB → 2GB if needed
- Cloud SQL: db-f1-micro → db-n1-standard-2 if needed

### Rate Limiting
- 100 requests/minute per IP
- 1000 requests/minute per authenticated user
- Striped by cafeteria_id for multi-tenancy

---

**Next:** See API_SPEC.md for detailed endpoint documentation.
