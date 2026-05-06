import express from 'express';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import { ProductService } from '../services/ProductService';
import { StorageService } from '../services/StorageService';
import { asyncHandler } from '../middleware/errorHandler';
import { handleValidationErrors } from '../middleware/validation';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Validation rules
const productValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description max 500 characters'),
  body('category').isIn(['Coffee', 'Tea', 'Cold Drinks', 'Sandwiches', 'Pastries', 'Desserts', 'Breakfast', 'Combos']).withMessage('Invalid category'),
  body('sku').optional().trim().isLength({ max: 50 }).withMessage('SKU max 50 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('vat_percentage').isFloat({ min: 0, max: 100 }).withMessage('VAT must be 0-100'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be non-negative'),
  body('is_available').optional().isBoolean().withMessage('is_available must be boolean'),
  body('is_sold_out').optional().isBoolean().withMessage('is_sold_out must be boolean'),
  body('image_url').optional().isURL().withMessage('Invalid image URL'),
  body('is_featured').optional().isBoolean().withMessage('is_featured must be boolean'),
];

// GET /products - List products (public access for storefront)
router.get('/', [
  query('category').optional().isIn(['Coffee', 'Tea', 'Cold Drinks', 'Sandwiches', 'Pastries', 'Desserts', 'Breakfast', 'Combos']),
  query('is_available').optional().isBoolean(),
  query('search').optional().trim().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], handleValidationErrors, asyncHandler(async (req, res) => {
  // For public access, we need cafeteria_id from query or subdomain
  // For now, require cafeteria_id in query (will be improved later)
  const { cafeteria_id } = req.query;

  if (!cafeteria_id || typeof cafeteria_id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'cafeteria_id is required',
      statusCode: 400,
    });
  }

  const filters = {
    category: req.query.category as string,
    is_available: req.query.is_available ? req.query.is_available === 'true' : undefined,
    search: req.query.search as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
  };

  const result = await ProductService.getProducts(cafeteria_id, filters);

  res.json({
    success: true,
    data: result,
    timestamp: new Date(),
  });
}));

// GET /products/categories - Get available categories (public)
router.get('/categories', asyncHandler(async (req, res) => {
  const { cafeteria_id } = req.query;

  if (!cafeteria_id || typeof cafeteria_id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'cafeteria_id is required',
      statusCode: 400,
    });
  }

  const categories = await ProductService.getProductCategories(cafeteria_id);

  res.json({
    success: true,
    data: categories,
    timestamp: new Date(),
  });
}));

// GET /products/:id - Get single product (public)
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid product ID'),
], handleValidationErrors, asyncHandler(async (req, res) => {
  const product = await ProductService.getProductById(req.params.id);

  res.json({
    success: true,
    data: product,
    timestamp: new Date(),
  });
}));

// POST /products - Create product (Owner/Admin only)
router.post('/', [
  ...productValidation,
], handleValidationErrors, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
  const product = await ProductService.createProduct(
    req.cafeteriaId!,
    req.userId!,
    req.body
  );

  res.status(201).json({
    success: true,
    data: product,
    timestamp: new Date(),
  });
}));

// PUT /products/:id - Update product (Owner/Admin only)
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid product ID'),
  ...productValidation.map(rule => rule.optional()),
], handleValidationErrors, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
  const product = await ProductService.updateProduct(
    req.params.id,
    req.cafeteriaId!,
    req.userId!,
    req.body
  );

  res.json({
    success: true,
    data: product,
    timestamp: new Date(),
  });
}));

// DELETE /products/:id - Delete product (Owner only)
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid product ID'),
], handleValidationErrors, requireRole(['owner']), asyncHandler(async (req, res) => {
  await ProductService.deleteProduct(req.params.id, req.cafeteriaId!, req.userId!);

  res.json({
    success: true,
    message: 'Product deleted successfully',
    timestamp: new Date(),
  });
}));

// POST /products/:id/image - Upload product image (Owner/Admin only)
router.post('/:id/image', [
  param('id').isUUID().withMessage('Invalid product ID'),
], upload.single('image'), handleValidationErrors, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image file provided',
      statusCode: 400,
    });
  }

  // Upload the image
  const uploadResult = await StorageService.uploadProductImage(
    req.file.buffer,
    req.file.originalname,
    req.cafeteriaId!,
    req.params.id
  );

  // Update the product with the new image URL
  const product = await ProductService.updateProduct(
    req.params.id,
    req.cafeteriaId!,
    req.userId!,
    { image_url: uploadResult.url }
  );

  res.json({
    success: true,
    data: {
      product,
      image: uploadResult,
    },
    timestamp: new Date(),
  });
}));

// DELETE /products/:id/image - Delete product image (Owner/Admin only)
router.delete('/:id/image', [
  param('id').isUUID().withMessage('Invalid product ID'),
], handleValidationErrors, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
  // Get the current product to find the image URL
  const product = await ProductService.getProductById(req.params.id);

  if (!product.image_url) {
    return res.status(404).json({
      success: false,
      error: 'No image found for this product',
      statusCode: 404,
    });
  }

  // Extract filename from URL
  const urlParts = product.image_url.split('/');
  const filename = urlParts.slice(-3).join('/'); // cafeterias/id/products/id/filename

  // Delete the image from storage
  await StorageService.deleteProductImage(filename, req.cafeteriaId!);

  // Update the product to remove the image URL
  const updatedProduct = await ProductService.updateProduct(
    req.params.id,
    req.cafeteriaId!,
    req.userId!,
    { image_url: null }
  );

  res.json({
    success: true,
    data: updatedProduct,
    timestamp: new Date(),
  });
}));

// DELETE /products/:id/image - Delete product image (Owner/Admin only)
router.delete('/:id/image', [
  param('id').isUUID().withMessage('Invalid product ID'),
], handleValidationErrors, requireRole(['owner', 'admin']), asyncHandler(async (req, res) => {
  // Get the current product to find the image filename
  const product = await ProductService.getProductById(req.params.id);

  if (!product.image_url) {
    return res.status(400).json({
      success: false,
      error: 'Product has no image to delete',
      statusCode: 400,
    });
  }

  // Extract filename from URL
  const urlParts = product.image_url.split('/');
  const filename = urlParts.slice(-3).join('/'); // products/cafeteriaId/productId/filename

  // Delete the image
  await StorageService.deleteProductImage(filename, req.cafeteriaId!);

  // Update the product to remove the image URL
  await ProductService.updateProduct(
    req.params.id,
    req.cafeteriaId!,
    req.userId!,
    { image_url: null }
  );

  res.json({
    success: true,
    message: 'Product image deleted successfully',
    timestamp: new Date(),
  });
}));

export default router;
