import express from 'express';
import { body, param, query } from 'express-validator';
import { OrderService } from '../services/OrderService';
import { asyncHandler } from '../middleware/errorHandler';
import { handleValidationErrors } from '../middleware/validation';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('cafeteria_id').isUUID().withMessage('Invalid cafeteria ID'),
  body('customer_email').isEmail().withMessage('Valid email required'),
  body('customer_name').optional().trim().isLength({ max: 100 }).withMessage('Name max 100 characters'),
  body('order_type').isIn(['dine_in', 'takeaway', 'preorder', 'pickup']).withMessage('Invalid order type'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes max 500 characters'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.product_id').isUUID().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.add_ons').optional().isArray().withMessage('Add-ons must be array'),
  body('items.*.add_ons.*.name').optional().trim().isLength({ min: 1 }).withMessage('Add-on name required'),
  body('items.*.add_ons.*.price').optional().isFloat({ min: 0 }).withMessage('Add-on price must be positive'),
  body('items.*.notes').optional().trim().isLength({ max: 200 }).withMessage('Item notes max 200 characters'),
];

const orderFiltersValidation = [
  query('customer_email').optional().isEmail(),
  query('order_status').optional().isIn(['new', 'paid', 'preparing', 'ready', 'completed', 'cancelled']),
  query('payment_status').optional().isIn(['pending', 'paid', 'failed', 'refunded']),
  query('order_type').optional().isIn(['dine_in', 'takeaway', 'preorder', 'pickup']),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

// POST /orders - Create new order (public access for storefront)
router.post('/', createOrderValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const orderService = new OrderService(req.app.locals.db);
  const order = await orderService.createOrder(req.body);

  res.status(201).json({
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  });
}));

// GET /orders - List orders (admin/staff only)
router.get('/', requireRole(['admin', 'staff']), orderFiltersValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const orderService = new OrderService(req.app.locals.db);
  const cafeteriaId = req.user.cafeteria_id;

  const filters = {
    customer_email: req.query.customer_email as string,
    order_status: req.query.order_status as string,
    payment_status: req.query.payment_status as string,
    order_type: req.query.order_type as string,
    date_from: req.query.date_from ? new Date(req.query.date_from as string) : undefined,
    date_to: req.query.date_to ? new Date(req.query.date_to as string) : undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  };

  const result = await orderService.getOrders(cafeteriaId, filters);

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  });
}));

// GET /orders/:id - Get order details
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid order ID'),
], handleValidationErrors, asyncHandler(async (req, res) => {
  const orderService = new OrderService(req.app.locals.db);
  const order = await orderService.getOrder(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found',
      timestamp: new Date().toISOString(),
    });
  }

  // Check if user can access this order
  if (req.user && req.user.cafeteria_id !== order.cafeteria_id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  });
}));

// PUT /orders/:id/status - Update order status (admin/staff only)
router.put('/:id/status', requireRole(['admin', 'staff']), [
  param('id').isUUID().withMessage('Invalid order ID'),
  body('status').isIn(['new', 'paid', 'preparing', 'ready', 'completed', 'cancelled']).withMessage('Invalid status'),
], handleValidationErrors, asyncHandler(async (req, res) => {
  const orderService = new OrderService(req.app.locals.db);
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user.id);

  res.json({
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  });
}));

// DELETE /orders/:id - Cancel order (admin/staff only, or customer if new)
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid order ID'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason max 200 characters'),
], handleValidationErrors, asyncHandler(async (req, res) => {
  const orderService = new OrderService(req.app.locals.db);

  // Get order first to check ownership
  const order = await orderService.getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'Order not found',
      timestamp: new Date().toISOString(),
    });
  }

  // Check permissions
  if (req.user) {
    // Staff/admin can cancel any order
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: new Date().toISOString(),
      });
    }
  } else {
    // Public users can only cancel their own new orders
    // This would require additional authentication logic
    return res.status(403).json({
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  const cancelledOrder = await orderService.cancelOrder(req.params.id, req.body.reason, req.user.id);

  res.json({
    success: true,
    data: cancelledOrder,
    timestamp: new Date().toISOString(),
  });
}));

// GET /orders/summary - Get order summary (admin/staff only)
router.get('/summary', requireRole(['admin', 'staff']), [
  query('date').optional().isISO8601(),
], handleValidationErrors, asyncHandler(async (req, res) => {
  const orderService = new OrderService(req.app.locals.db);
  const cafeteriaId = req.user.cafeteria_id;
  const date = req.query.date ? new Date(req.query.date as string) : undefined;

  const summary = await orderService.getOrderSummary(cafeteriaId, date);

  res.json({
    success: true,
    data: summary,
    timestamp: new Date().toISOString(),
  });
}));

export default router;