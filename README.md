# Cafeteria Lite Professional - SaaS Platform

A modern, secure, and scalable SaaS platform for small cafeterias to manage their operations, products, orders, and billing.

## 🎯 Project Vision

**Cafeteria Lite Professional** combines individual simplicity with professional tools—a sweet spot for small cafeteria operators:

- **Menu & Product Management**: Upload products, images, pricing, VAT
- **Online Storefront**: Customers browse and order
- **Secure Payments**: Stripe integration for online payments
- **Order Management**: Track orders from new → ready → completed
- **Inventory Tracking**: Monitor stock levels, low-stock alerts
- **Invoicing & Reporting**: Generate invoices, end-of-day reports
- **Staff Management**: Multiple staff roles with RBAC
- **Professional Features**: Audit logs, analytics, email reports
- **Limited & Affordable**: 50 products max, 100 images, 5 staff users, $19/month

## 📋 Full 5-Phase Roadmap

| Phase | Timeline | Features |
|-------|----------|----------|
| **0** | Weeks 1-2 | Infrastructure, database, auth, audit logging |
| **1** | Weeks 3-5 | Products, storefront, basic admin dashboard |
| **2** | Weeks 6-8 | Stripe payments, order tracking, owner notifications |
| **3** | Weeks 9-11 | Inventory, invoicing, daily reports |
| **4** | Weeks 12-14 | Staff management, RBAC, subscription billing |
| **5** | Weeks 15-17 | Combos, add-ons, scheduling, mobile POS, analytics |

**Current Status**: ✅ Phase 0 COMPLETE

## 🏗️ Architecture

- **Frontend**: React 18 (web admin), Flutter (mobile POS)
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL on Cloud SQL
- **Auth**: Firebase Auth + JWT
- **Storage**: Firebase Storage (images), Cloud Storage (PDFs)
- **Payments**: Stripe (transactions + subscriptions)
- **Hosting**: Google Cloud Run (auto-scaling containers)
- **IaC**: Terraform (reproducible infrastructure)
- **CI/CD**: GitHub Actions (auto-deploy on main branch)

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system design.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker
- gcloud CLI (for Google Cloud)
- GitHub account (for Actions)
- Stripe account (test keys)
- Firebase project

### Local Development

```bash
# Clone repository
git clone <repo-url>
cd addictic-compu-machine

# Backend setup
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev

# In a new terminal: Frontend setup
cd frontend-web
npm install
npm run dev

# Access endpoints
# Admin: http://localhost:3001
# API: http://localhost:3000/health
```

### Environment Configuration

```bash
# backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cafeteria_lite_dev
DB_USER=postgres
DB_PASSWORD=password

FIREBASE_PROJECT_ID=your-project-id
STRIPE_SECRET_KEY=sk_test_xxx
JWT_SECRET=your-secret-key
# ... see .env.example for all variables
```

### Database Setup

```bash
cd backend
npm install
npx knex migrate:latest  # Run all migrations
npm run dev              # Start server
```

## 📚 Documentation

- [**IMPLEMENTATION_GUIDE.md**](docs/IMPLEMENTATION_GUIDE.md) - Local setup, workflow, testing, troubleshooting
- [**ARCHITECTURE.md**](docs/ARCHITECTURE.md) - System design, data flow, security model
- [**API_SPEC.md**](docs/API_SPEC.md) - Detailed endpoint documentation (in progress)

## 🔐 Security Features

- ✅ PCI DSS aligned (Stripe-only payments)
- ✅ Audit logging from day 1
- ✅ Role-based access control (RBAC)
- ✅ Multi-tenant data isolation
- ✅ Input validation & sanitization
- ✅ Rate limiting (100 req/min per IP)
- ✅ Helmet security headers
- ✅ Secret Manager for credentials
- ✅ Firebase Auth with optional MFA
- ✅ JWT token expiration (7 days)

Full security checklist in [IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md#security-checklist-pre-launch).

## 📁 Project Structure

```
addictic-compu-machine/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── middleware/        # Auth, audit, error handling
│   │   ├── routes/            # API endpoints (Phase 1+)
│   │   ├── services/          # Business logic (Phase 1+)
│   │   └── utils/             # Database, logging, secrets
│   ├── migrations/            # Database schema
│   ├── package.json
│   └── Dockerfile
│
├── frontend-web/              # React admin dashboard
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend-mobile/           # Flutter POS app (Phase 5)
│
├── terraform/                 # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars.example
│
├── docs/                      # Documentation
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── ARCHITECTURE.md
│   └── API_SPEC.md
│
└── .github/workflows/         # CI/CD pipeline
    └── deploy.yml
```

## 🧪 Testing

```bash
# Backend unit tests
cd backend
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## 🚢 Deployment

### Manual Deployment to Staging

```bash
# Build Docker image
docker build -t gcr.io/my-project/cafeteria-lite-api:latest backend/

# Push to Container Registry
docker push gcr.io/my-project/cafeteria-lite-api:latest

# Deploy to Cloud Run
gcloud run deploy cafeteria-lite-api-staging \
  --image gcr.io/my-project/cafeteria-lite-api:latest \
  --region us-central1 \
  --platform managed
```

### Automatic Deployment via GitHub Actions

Push to `main` branch → GitHub Actions automatically:
1. Runs tests
2. Builds Docker image
3. Deploys to Cloud Run (staging)

See `.github/workflows/deploy.yml`.

## 📊 Pricing & Limits

### Cafeteria Lite Professional Tier

| Feature | Limit |
|---------|-------|
| Monthly Price | $19 USD |
| Menu Items | 50 |
| Product Pictures | 100 |
| Staff Users | 5 |
| Business Locations | 1 |
| VAT Profiles | 1 |
| Order History | Unlimited |

## 💰 Cost Estimates (Monthly)

| Service | Staging | Production |
|---------|---------|-----------|
| Cloud SQL (db-f1-micro) | $10 | $30 |
| Cloud Run (512MB, 1 CPU) | $20 | $50 |
| Cloud Storage (images) | $5 | $15 |
| Secret Manager | Free | Free |
| **Total** | **$35** | **$95** |

*Note: Production includes redundancy and higher compute tier.*

## 🔧 Development Workflow

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes, commit, push
3. Open pull request on GitHub
4. GitHub Actions runs tests
5. Code review & approval
6. Merge to main → auto-deploy to staging
7. Manual promotion to production (if ready)

## 📞 Support & Troubleshooting

Common issues and solutions are documented in [IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md#support--troubleshooting).

For technical questions, check the docs or open an issue on GitHub.

## 🛣️ Roadmap

- **Next**: Phase 1 (Product Management & Storefront) - 3 weeks
- **After**: Phase 2 (Payments & Orders) - 3 weeks
- **Then**: Phase 3 (Inventory & Invoicing) - 3 weeks
- **Planning**: Phase 4 & 5 based on user feedback

## 📜 License

Private project. All rights reserved.

## 👨‍💻 Author

Built by [Your Name/Team] for small cafeteria operators worldwide.

---

**Ready to build?** Start with:
1. Clone the repo
2. Follow [IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) for local setup
3. Check [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
4. Begin Phase 1 development!

**Questions?** See the docs or reach out to the team.

Last updated: May 2024
