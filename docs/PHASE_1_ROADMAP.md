# Phase 1 Roadmap - Product Management & Storefront

**Duration**: Weeks 3-5 (3 weeks)  
**Goal**: Launch MVP with product management and basic storefront

## 📋 Detailed Tasks

### Week 3: Backend API & Product Management

#### Day 1-2: Product Routes & Service

**Files to create:**
- `backend/src/routes/products.ts`
- `backend/src/services/ProductService.ts`
- `backend/src/models/Product.ts`

**Endpoints:**
```
GET    /products                      - List products (paginated)
GET    /products/:id                  - Get product details
POST   /products                      - Create product (owner/admin only)
PUT    /products/:id                  - Update product (owner/admin only)
DELETE /products/:id                  - Delete product (owner only)
```

**Product fields to validate:**
- name (required, string, max 100)
- description (optional, string, max 500)
- category (required, enum)
- price (required, number > 0)
- vat_percentage (required, 0-100)
- sku (optional, unique)
- stock_quantity (required, >= 0)
- image_url (optional)

**Tests to write:**
- ✅ Create product with valid data
- ✅ Reject product without category
- ✅ Reject negative price
- ✅ Only owner/admin can create
- ✅ Soft delete (set `deleted_at`)

Checklist:
- [ ] Routes created
- [ ] Service layer implemented
- [ ] Unit tests passing
- [ ] Error handling for duplicates
- [ ] Audit logging on create/update

#### Day 3-4: Product Images API

**Files to create:**
- `backend/src/services/StorageService.ts`
- `backend/src/routes/uploads.ts`

**Endpoints:**
```
POST   /products/:id/upload-image     - Upload product image
DELETE /products/:id/images/:imageId  - Delete product image
```

**Implementation:**
- Accept `.jpg`, `.png`, `.webp` only
- Max 2MB per image
- Store in Firebase Storage
- Path: `cafeterias/{cafeteria_id}/products/{product_id}/{timestamp}.{ext}`
- Return signed URL (valid 7 days)
- Audit log each upload

**Tests:**
- ✅ Upload valid image
- ✅ Reject non-image file
- ✅ Reject image > 2MB
- ✅ Delete image successfully
- ✅ Signed URL generation

Checklist:
- [ ] Firebase Storage SDK integrated
- [ ] Image validation logic
- [ ] URL signing working
- [ ] Error handling for oversized files
- [ ] CORS properly configured

#### Day 5: Product Categories & Testing

**Create:**
- `backend/src/routes/categories.ts`
- `backend/src/services/CategoryService.ts`

**Endpoints:**
```
GET    /categories                    - List all categories
POST   /categories                    - Create category (owner only)
PUT    /categories/:id                - Update category (owner only)
```

**Predefined categories:**
- Coffee
- Tea
- Cold Drinks
- Sandwiches
- Pastries
- Desserts
- Breakfast
- Combos

Checklist:
- [ ] Categories seeded on first run
- [ ] Owner can disable categories
- [ ] Pagination working
- [ ] Unit tests: create, list, update
- [ ] Deploy to staging

---

### Week 4: Web Admin Dashboard

#### Day 1-2: Project Setup & Login

**Setup:**
- [ ] React Router configured
- [ ] State management (Zustand) set up
- [ ] API client with axios + interceptors
- [ ] Firebase Auth integration

**Files:**
- `frontend-web/src/App.tsx` - Main routing
- `frontend-web/src/services/api.ts` - HTTP client
- `frontend-web/src/services/auth.ts` - Firebase wrapper
- `frontend-web/src/store/authStore.ts` - Zustand store

**Login Flow:**
1. User enters email/password
2. Firebase Auth returns ID token
3. Token stored in localStorage
4. Token sent in `Authorization` header on all API calls
5. On logout: clear token, redirect to login

**Tests:**
- ✅ Login form submits correctly
- ✅ Token stored in localStorage
- ✅ API calls include token
- ✅ 401 → redirect to login

Checklist:
- [ ] Firebase config in environment
- [ ] Login page renders
- [ ] Protected routes working
- [ ] Token refresh logic

#### Day 3: Admin Dashboard Layout

**Create:**
- `frontend-web/src/layouts/AdminLayout.tsx` - Navigation, sidebar
- `frontend-web/src/pages/Dashboard.tsx` - Dashboard home
- Component structure

**Components:**
- Navbar (logo, user menu, logout)
- Sidebar navigation
- Dashboard card layouts
- Quick stats display

**Navigation items:**
- Dashboard (home)
- Products
- Orders (Phase 2)
- Inventory (Phase 3)
- Reports (Phase 3)
- Settings
- Billing (Phase 4)
- Users (Phase 4)

Checklist:
- [ ] Responsive design (mobile + desktop)
- [ ] Navigation working
- [ ] Logout redirects to login
- [ ] Active nav item highlighted
- [ ] Tailwind styling applied

#### Day 4-5: Product Management UI

**Create:**
- `frontend-web/src/pages/ProductsPage.tsx`
- `frontend-web/src/components/ProductForm.tsx`
- `frontend-web/src/components/ProductList.tsx`
- `frontend-web/src/components/ImageUpload.tsx`

**Features:**
- List products (table with pagination)
- Add new product (modal form)
- Edit product (form)
- Delete product (confirm dialog)
- Upload product image
- Search products (optional)
- Filter by category

**Form validation:**
- Name required
- Price > 0
- VAT 0-100
- Category required
- Stock >= 0

**Image upload:**
- Drag-and-drop or file picker
- Progress indicator
- Error handling
- Display uploaded image

**Tests:**
- ✅ Products list renders
- ✅ Can add new product
- ✅ Can edit product
- ✅ Can delete product
- ✅ Image upload works

Checklist:
- [ ] Products page displays
- [ ] Form validation working
- [ ] API calls functioning
- [ ] Images upload to Firebase
- [ ] Error messages shown to user
- [ ] Loading states (spinners)
- [ ] Deploy to staging

---

### Week 5: Storefront & Deployment

#### Day 1-2: Public Storefront

**Create:**
- `frontend-web/src/pages/StorefrontPage.tsx` (public, no auth)
- `frontend-web/src/components/ProductCard.tsx`
- `frontend-web/src/components/CategoryFilter.tsx`
- `frontend-web/src/store/cartStore.ts`

**Features:**
- Browse all products
- Filter by category
- Product cards with image, name, price, VAT
- "Add to Cart" button
- Availability badge

**Shopping Cart:**
- Store in localStorage
- Show item count in header
- Persist across page reload
- Update quantity, remove items (next phase)

**Payment Button:**
- "View Cart & Checkout" button (links to Phase 2)
- Shows subtotal + VAT preview

Checklist:
- [ ] Storefront displays products
- [ ] Category filter working
- [ ] Images loading correctly
- [ ] Cart persists in localStorage
- [ ] Responsive design
- [ ] No login required

#### Day 3-4: Testing & Optimization

**Writing tests:**
- [ ] Unit tests for services
- [ ] Component tests (React Testing Library)
- [ ] E2E test: login → browse products → add to cart
- [ ] API integration tests (staging)

**Performance:**
- [ ] Images lazy-loaded
- [ ] Code splitting working
- [ ] Bundle size < 500KB
- [ ] Lighthouse score > 80

**Browser compatibility:**
- [ ] Chrome/Firefox/Safari
- [ ] Mobile responsive
- [ ] Touch-friendly buttons

#### Day 5: Staging Deployment & QA

**Deployment:**
- [ ] All tests passing
- [ ] Build produces no errors
- [ ] GitHub Actions CI/CD working
- [ ] Backend deployed to staging
- [ ] Frontend deployed to staging

**Manual QA Checklist:**
- [ ] Owner can login
- [ ] Owner can create product
- [ ] Owner can upload image
- [ ] Image displays correctly
- [ ] Customer can view storefront
- [ ] Customer can add to cart
- [ ] Cart persists after refresh
- [ ] Prices display with VAT
- [ ] No console errors
- [ ] Mobile layout works

**Production Readiness:**
- [ ] All secrets in Secret Manager
- [ ] Environment variables configured
- [ ] Logging working
- [ ] Database accessible
- [ ] HTTPS enforced
- [ ] CORS configured

---

## 📊 Success Criteria

✅ **Phase 1 Complete When:**
1. Backend product API fully functional
2. Product image uploads working
3. Web admin dashboard functional
4. Public storefront displays products
5. Shopping cart working
6. All tests passing
7. Deployed to staging
8. QA passed all manual tests

## 📈 Metrics to Track

| Metric | Target |
|--------|--------|
| API Response Time | < 200ms p95 |
| Storefront Load Time | < 2s |
| Backend Test Coverage | > 80% |
| Frontend Component Tests | > 70% |
| Uptime (staging) | 99.5% |
| Error Rate | < 1% |

## 🔗 Dependencies

- Phase 0 infrastructure operational
- GCP project configured
- Firebase Auth setup
- Stripe account (for Phase 2)

## 📝 Notes

- Phase 1 focuses on MVP: read operations, basic CRUD
- Complex features (combos, add-ons) deferred to Phase 5
- Search/filtering can be enhanced in Phase 3+
- Mobile POS deferred to Phase 5

---

**Next Phase**: Phase 2 (Payments & Orders) will add Stripe checkout, order creation, and real-time notifications.
