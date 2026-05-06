# Cafeteria Lite Professional - Developer Quick Reference

## 🚀 Quick Start (5 minutes)

```bash
# Clone & install
git clone <repo> && cd addictic-compu-machine
bash setup.sh

# Update .env credentials
code backend/.env

# Migrate DB & start servers
cd backend && npx knex migrate:latest && npm run dev

# In new terminal
cd frontend-web && npm run dev

# Open http://localhost:3001
```

## 📁 Key Directories

| Path | Purpose |
|------|---------|
| `backend/src/` | Node.js API code |
| `backend/migrations/` | Database schema files |
| `frontend-web/src/` | React admin dashboard |
| `terraform/` | Google Cloud infrastructure |
| `docs/` | Documentation |

## 🔌 API Endpoints (Phase 1+)

```
POST   /auth/signup              - Create owner account
POST   /auth/login               - Login (Firebase)
GET    /products                 - List products
POST   /products                 - Create product
PUT    /products/:id             - Update product
DELETE /products/:id             - Delete product
POST   /products/:id/images      - Upload product image
GET    /categories               - List categories
GET    /me/cafeteria             - Get cafeteria profile
PUT    /me/cafeteria             - Update profile
```

Full API spec: See `docs/API_SPEC.md` (in progress)

## 🗄️ Database

```bash
# Create migration
npx knex migrate:make migration_name

# Run migrations
npx knex migrate:latest

# Rollback last migration
npx knex migrate:rollback

# View status
npx knex migrate:status

# Run seeds
npx knex seed:run
```

Current tables: `users`, `roles`, `cafeteria_profiles`, `subscriptions`, `products`, `orders`, `invoices`, `payments`, `inventory`, `audit_logs`

## 🧪 Testing

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## 🐳 Docker & Deployment

```bash
# Build image
docker build -t cafeteria-lite-api:latest backend/

# Run locally
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  cafeteria-lite-api:latest

# Deploy to Cloud Run (via GitHub Actions)
git push origin main  # Automatic!
```

## 🔐 Secrets Management

```bash
# Add secret to Google Secret Manager
gcloud secrets create stripe-key --data-file=./stripe-key.txt

# Rotate secret quarterly
gcloud secrets versions add stripe-key --data-file=./new-stripe-key.txt

# List all secrets
gcloud secrets list
```

## 📊 Monitoring

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Real-time logs
gcloud logging read --follow "resource.type=cloud_run_revision"

# Errors only
gcloud logging read "severity=ERROR" --limit 20
```

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes & commit
git add . && git commit -m "feat: add new feature"

# Push & open PR
git push origin feature/new-feature
# Create PR on GitHub

# After approval & merge to main
# → GitHub Actions auto-deploys to staging
```

## 🚨 Common Commands

```bash
# Check health
curl http://localhost:3000/health

# Test API (with JWT token)
curl -H "Authorization: Bearer <token>" http://localhost:3000/products

# View database
psql -U postgres -d cafeteria_lite_dev

# Kill all Node processes
pkill -f "node"

# Clear npm cache
npm cache clean --force

# Update dependencies
npm update --save
```

## 📚 Documentation Files

- `README.md` - Project overview
- `docs/IMPLEMENTATION_GUIDE.md` - Local setup & workflow
- `docs/ARCHITECTURE.md` - System design
- `docs/API_SPEC.md` - API endpoints (coming Phase 1)

## 💡 Development Tips

1. **Restart server after .env changes** – Changes to environment variables require restart
2. **Hot reload** – Frontend auto-reloads with Vite, backend needs restart
3. **Database issues?** – Clear migrations: `npx knex migrate:rollback --all` then `npx knex migrate:latest`
4. **Why is my API request failing?** – Check browser console for CORS errors, check logs: `node_modules/.bin/tail -f logs/combined.log`
5. **Testing Firebase locally?** – Use test mode, Firestore emulator, or dummy tokens

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to DB | `psql` works? Check Cloud SQL, VPC connector |
| Port 3000/3001 in use | `lsof -i :3000` to find process, `kill -9 <PID>` |
| Firebase auth fails | Check FIREBASE_PROJECT_ID in .env |
| DK image won't push | Authenticate: `gcloud auth configure-docker` |
| Stripe webhook fails | Verify webhook secret in Secret Manager |

## 📞 Help

- Check `docs/IMPLEMENTATION_GUIDE.md` section "Support & Troubleshooting"
- Read error logs: `tail -f logs/combined.log`
- Search GitHub issues
- Ask team lead

---

**Last Updated**: May 2024  
**Version**: Phase 0 (Foundation)
