import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface Product {
  id: string;
  cafeteria_id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  price: number;
  vat_percentage: number;
  stock_quantity: number;
  is_available: boolean;
  is_sold_out: boolean;
  image_url?: string | null;
  is_featured: boolean;
  availability_schedule?: any;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  category: string;
  sku?: string;
  price: number;
  vat_percentage: number;
  stock_quantity: number;
  is_available?: boolean;
  is_sold_out?: boolean;
  image_url?: string | null;
  is_featured?: boolean;
  availability_schedule?: any;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export class ProductService {
  static async createProduct(
    cafeteriaId: string,
    userId: string,
    data: CreateProductData
  ): Promise<Product> {
    try {
      // Check product limit (50 for Lite Professional)
      const productCount = await db('products')
        .where('cafeteria_id', cafeteriaId)
        .count('id as count')
        .first();

      if (parseInt(productCount?.count as string) >= 50) {
        throw new Error('Product limit reached (50 products max for Lite Professional plan)');
      }

      const productId = uuidv4();
      const productData = {
        id: productId,
        cafeteria_id: cafeteriaId,
        name: data.name,
        description: data.description,
        category: data.category,
        sku: data.sku,
        price: data.price,
        vat_percentage: data.vat_percentage,
        stock_quantity: data.stock_quantity,
        is_available: data.is_available ?? true,
        is_sold_out: data.is_sold_out ?? false,
        image_url: data.image_url,
        is_featured: data.is_featured ?? false,
        availability_schedule: data.availability_schedule,
        created_by: userId,
        updated_by: userId,
      };

      await db('products').insert(productData);

      logger.info('Product created', { productId, cafeteriaId, userId });
      return await this.getProductById(productId);
    } catch (error) {
      logger.error('Failed to create product', { error, cafeteriaId, userId });
      throw error;
    }
  }

  static async getProducts(
    cafeteriaId: string,
    filters: {
      category?: string;
      is_available?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
    try {
      const { category, is_available, search, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      let query = db('products')
        .where('cafeteria_id', cafeteriaId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Apply filters
      if (category) {
        query = query.where('category', category);
      }

      if (is_available !== undefined) {
        query = query.where('is_available', is_available);
      }

      if (search) {
        query = query.where(function() {
          this.where('name', 'ilike', `%${search}%`)
              .orWhere('description', 'ilike', `%${search}%`);
        });
      }

      const products = await query;

      // Get total count
      let countQuery = db('products')
        .where('cafeteria_id', cafeteriaId)
        .count('id as count');

      if (category) {
        countQuery = countQuery.where('category', category);
      }

      if (is_available !== undefined) {
        countQuery = countQuery.where('is_available', is_available);
      }

      if (search) {
        countQuery = countQuery.where(function() {
          this.where('name', 'ilike', `%${search}%`)
              .orWhere('description', 'ilike', `%${search}%`);
        });
      }

      const totalResult = await countQuery.first();
      const total = parseInt(totalResult?.count as string) || 0;

      return {
        products,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to get products', { error, cafeteriaId, filters });
      throw error;
    }
  }

  static async getProductById(productId: string): Promise<Product> {
    try {
      const product = await db('products')
        .where('id', productId)
        .first();

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      logger.error('Failed to get product by ID', { error, productId });
      throw error;
    }
  }

  static async updateProduct(
    productId: string,
    cafeteriaId: string,
    userId: string,
    data: UpdateProductData
  ): Promise<Product> {
    try {
      const updateData = {
        ...data,
        updated_at: db.fn.now(),
        updated_by: userId,
      };

      const updatedRows = await db('products')
        .where('id', productId)
        .andWhere('cafeteria_id', cafeteriaId)
        .update(updateData);

      if (updatedRows === 0) {
        throw new Error('Product not found or access denied');
      }

      logger.info('Product updated', { productId, cafeteriaId, userId });
      return await this.getProductById(productId);
    } catch (error) {
      logger.error('Failed to update product', { error, productId, cafeteriaId, userId });
      throw error;
    }
  }

  static async deleteProduct(productId: string, cafeteriaId: string, userId: string): Promise<void> {
    try {
      // Soft delete by setting deleted_at timestamp
      const updatedRows = await db('products')
        .where('id', productId)
        .andWhere('cafeteria_id', cafeteriaId)
        .update({
          is_available: false,
          updated_at: db.fn.now(),
          updated_by: userId,
        });

      if (updatedRows === 0) {
        throw new Error('Product not found or access denied');
      }

      logger.info('Product deleted (soft)', { productId, cafeteriaId, userId });
    } catch (error) {
      logger.error('Failed to delete product', { error, productId, cafeteriaId, userId });
      throw error;
    }
  }

  static async getProductCategories(cafeteriaId: string): Promise<string[]> {
    try {
      const categories = await db('products')
        .where('cafeteria_id', cafeteriaId)
        .distinct('category')
        .pluck('category');

      return categories;
    } catch (error) {
      logger.error('Failed to get product categories', { error, cafeteriaId });
      throw error;
    }
  }
}
