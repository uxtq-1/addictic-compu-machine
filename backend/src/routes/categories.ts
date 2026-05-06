import express from 'express';
import { query } from 'express-validator';
import { ProductService } from '../services/ProductService';
import { asyncHandler } from '../middleware/errorHandler';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Predefined categories (from plan)
const PREDEFINED_CATEGORIES = [
  'Coffee',
  'Tea',
  'Cold Drinks',
  'Sandwiches',
  'Pastries',
  'Desserts',
  'Breakfast',
  'Combos',
];

// GET /categories - Get all available categories (public)
router.get('/', [
  query('cafeteria_id').isUUID().withMessage('Invalid cafeteria_id'),
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { cafeteria_id } = req.query as { cafeteria_id: string };

  // Get categories that have products in this cafeteria
  const availableCategories = await ProductService.getProductCategories(cafeteria_id);

  // Return predefined categories with availability status
  const categories = PREDEFINED_CATEGORIES.map(category => ({
    name: category,
    available: availableCategories.includes(category),
  }));

  res.json({
    success: true,
    data: categories,
    timestamp: new Date(),
  });
}));

export default router;