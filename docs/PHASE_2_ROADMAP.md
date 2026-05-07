# Phase 2 Roadmap - Orders, Payments & Storefront

**Duration**: Weeks 6-8 (3 weeks)  
**Goal**: Complete order processing, payment integration, and customer storefront

## 📋 Detailed Tasks

### Week 6: Order Management Backend

#### Day 1-2: Order Models & Database Schema

**Database Tables to Add:**
- `orders` - Order header with customer info, status, totals
- `order_items` - Order line items with product details
- `order_status_history` - Status change tracking

**Order Fields:**
- id, cafeteria_id, customer_email, customer_name
- order_type (dine_in, take_away, delivery)
- status (pending, confirmed, preparing, ready, completed, cancelled)
- subtotal, tax_amount, total_amount, payment_status
- special_instructions, created_at, updated_at

**Order Item Fields:**
- id, order_id, product_id, quantity, unit_price, total_price
- product_snapshot (name, description, image_url at time of order)

#### Day 3-4: Order Service & API

**Files to create:**
- `backend/src/models/Order.ts`
- `backend/src/services/OrderService.ts`
- `backend/src/routes/orders.ts`

**Endpoints:**
```
POST   /orders                      - Create new order
GET    /orders                      - List orders (paginated, filtered)
GET    /orders/:id                  - Get order details
PUT    /orders/:id/status           - Update order status
DELETE /orders/:id                  - Cancel order (if pending)
```

**Business Logic:**
- Validate product availability and stock
- Calculate totals with VAT
- Update inventory on order confirmation
- Send email notifications
- Audit all order changes

#### Day 5: Payment Integration (Stripe)

**Files to create:**
- `backend/src/services/PaymentService.ts`
- `backend/src/routes/webhooks.ts` (Stripe webhooks)

**Stripe Integration:**
- Create checkout sessions for orders
- Handle payment success/failure webhooks
- Update order payment status
- Send receipt emails
- Refund processing

### Week 7: Customer Storefront

#### Day 1-2: Storefront UI Setup

**Create:**
- `frontend-web/src/pages/Storefront.tsx`
- `frontend-web/src/components/ProductCard.tsx`
- `frontend-web/src/components/Cart.tsx`
- `frontend-web/src/components/CheckoutForm.tsx`

**Features:**
- Product grid display
- Category filtering
- Add to cart functionality
- Cart sidebar/popup
- Basic responsive design

#### Day 3-4: Cart & Checkout Flow

**Cart Management:**
- Add/remove products
- Quantity adjustments
- Price calculations
- Local storage persistence
- Cart validation

**Checkout Process:**
- Customer details form (email, name, order type)
- Order summary
- Special instructions
- Stripe checkout integration

#### Day 5: Order Status & History

**Features:**
- Order status tracking
- Order history for customers
- Email order confirmations
- Real-time status updates (WebSocket)

### Week 8: Testing & Polish

#### Day 1-2: Integration Testing

**Test Scenarios:**
- Complete order flow (cart → payment → confirmation)
- Payment webhook handling
- Inventory updates
- Email notifications
- Error handling (out of stock, payment failure)

#### Day 3-4: UI/UX Polish

**Improvements:**
- Loading states
- Error messages
- Mobile responsiveness
- Accessibility (WCAG compliance)
- Performance optimization

#### Day 5: Deployment & Monitoring

**Setup:**
- Production build testing
- Error monitoring (Sentry)
- Performance monitoring
- Backup procedures
- Documentation updates

## 🎯 Phase 2 Success Criteria

- [ ] Customers can browse products and add to cart
- [ ] Complete checkout flow with Stripe payment
- [ ] Order status tracking and notifications
- [ ] Inventory automatically updates on orders
- [ ] Email receipts and order confirmations
- [ ] Admin can view and manage all orders
- [ ] Mobile-responsive storefront
- [ ] Comprehensive error handling
- [ ] Unit and integration tests passing
- [ ] Production deployment ready

## 🔗 Dependencies

**New Packages to Add:**
- `stripe` - Payment processing
- `@stripe/stripe-js` - Frontend Stripe integration
- `socket.io` - Real-time order updates
- `bull` - Background job processing (already in package.json)

**Database Migrations:**
- Add orders, order_items, order_status_history tables
- Add payment-related fields to orders table

**Environment Variables:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY`
- `SENDGRID_API_KEY`