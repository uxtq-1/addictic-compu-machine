# API Specification Template

**Note**: This document outlines the API design for Phase 1. Detailed endpoints will be added as they're implemented.

## Base URL

```
Development: http://localhost:3000
Staging:     https://cafeteria-lite-api-staging.run.app
Production:  https://cafeteria-lite-api.run.app
```

## Authentication

All protected endpoints require:
```
Authorization: Bearer <firebase_id_token>
```

## Response Format

### Success Response (200, 201)
```json
{
  "success": true,
  "data": { /* resource */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "error": "Human-readable error message",
  "statusCode": 400,
  "details": { /* optional validation errors */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Pagination

For list endpoints:
```
GET /products?page=1&limit=20&sort=created_at&order=desc
```

Response:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Endpoints (Phase 1)

### Products

#### GET /products
List all products for cafeteria
- **Auth**: None (public)
- **Params**: `page`, `limit`, `category`, `search` (optional)
- **Response**: List of products with pagination

#### POST /products
Create new product
- **Auth**: Required (Owner/Admin only)
- **Body**:
  ```json
  {
    "name": "Cappuccino",
    "description": "Classic Italian cappuccino",
    "category": "Coffee",
    "price": 4.50,
    "vat_percentage": 10,
    "sku": "CAP-001",
    "stock_quantity": 50,
    "is_available": true
  }
  ```
- **Response**: Created product object with ID

#### PUT /products/:id
Update product
- **Auth**: Required (Owner/Admin only)
- **Body**: Same as POST (all fields optional)
- **Response**: Updated product object

#### DELETE /products/:id
Delete product (soft delete)
- **Auth**: Required (Owner only)
- **Response**: `{ "success": true }`

---

### Product Images

#### POST /products/:id/upload-image
Upload product image
- **Auth**: Required (Owner/Admin only)
- **Body**: multipart/form-data with `image` file
- **Constraints**: Max 2MB, .jpg/.png/.webp only
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "image_id": "uuid",
      "image_url": "https://storage.googleapis.com/...",
      "expires_at": "2024-02-15T10:30:00Z"
    }
  }
  ```

#### DELETE /products/:id/images/:imageId
Delete product image
- **Auth**: Required (Owner/Admin only)
- **Response**: `{ "success": true }`

---

### Categories

#### GET /categories
List all product categories
- **Auth**: Optional
- **Response**: List of categories with metadata

#### POST /categories
Create category
- **Auth**: Required (Owner only)
- **Body**: `{ "name": "Cold Drinks", "icon": "ice_cream" }`
- **Response**: Created category

---

### Cafeteria Profile

#### GET /me/cafeteria
Get cafeteria profile
- **Auth**: Required
- **Response**: Cafeteria profile object

#### PUT /me/cafeteria
Update cafeteria profile
- **Auth**: Required (Owner only)
- **Body**: 
  ```json
  {
    "name": "Joe's Coffee",
    "description": "Best coffee in town",
    "address": "123 Main St",
    "city": "San Francisco",
    "postal_code": "94105",
    "country": "USA",
    "phone": "+1-555-123-4567",
    "default_vat_percentage": 10,
    "opening_hours": {
      "monday": "08:00-17:00",
      "tuesday": "08:00-17:00"
    }
  }
  ```
- **Response**: Updated profile

---

### Health Check

#### GET /health
Check API health
- **Auth**: None
- **Response**: `{ "status": "ok", "timestamp": "..." }`

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (unique constraint) |
| 413 | Payload Too Large |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Rate Limiting

- Anonymous users: 100 requests/minute per IP
- Authenticated users: 1000 requests/minute
- Stripe webhooks: Unlimited

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705328400
```

---

## CORS

Allowed origins:
- `http://localhost:3001` (development)
- `https://admin.cafeterialite.com` (staging)
- `https://app.cafeterialite.com` (production)

---

## Full Endpoint Details Coming Phase 1

- [ ] Detailed request/response examples
- [ ] Field descriptions and constraints
- [ ] Error scenarios and handling
- [ ] Webhook specifications (Stripe)
- [ ] WebSocket events (real-time orders, Phase 2)

**Status**: Template completed, implementations follow in Phase 1 development.
