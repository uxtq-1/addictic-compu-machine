import { ProductService, CreateProductData } from '../services/ProductService';
import { db } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

describe('ProductService', () => {
  let testCafeteriaId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test cafeteria and user
    testCafeteriaId = uuidv4();
    testUserId = uuidv4();

    await db('cafeteria_profiles').insert({
      id: testCafeteriaId,
      name: 'Test Cafeteria',
      owner_id: testUserId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await db('users').insert({
      id: testUserId,
      email: 'owner@test.com',
      role: 'owner',
      cafeteria_id: testCafeteriaId,
      created_at: new Date(),
      updated_at: new Date(),
    });
  });

  describe('createProduct', () => {
    it('should create a product with valid data', async () => {
      const productData: CreateProductData = {
        name: 'Test Coffee',
        description: 'A delicious test coffee',
        category: 'Coffee',
        price: 3.50,
        vat_percentage: 10,
        stock_quantity: 100,
      };

      const product = await ProductService.createProduct(testCafeteriaId, testUserId, productData);

      expect(product).toBeDefined();
      expect(product.name).toBe('Test Coffee');
      expect(product.cafeteria_id).toBe(testCafeteriaId);
      expect(product.price).toBe(3.50);
      expect(product.is_available).toBe(true);
    });

    it('should reject product without category', async () => {
      const productData: CreateProductData = {
        name: 'Test Product',
        price: 5.00,
        vat_percentage: 10,
        stock_quantity: 50,
        // Missing category
      } as any;

      await expect(ProductService.createProduct(testCafeteriaId, testUserId, productData))
        .rejects.toThrow();
    });

    it('should reject negative price', async () => {
      const productData: CreateProductData = {
        name: 'Test Product',
        category: 'Coffee',
        price: -5.00,
        vat_percentage: 10,
        stock_quantity: 50,
      };

      await expect(ProductService.createProduct(testCafeteriaId, testUserId, productData))
        .rejects.toThrow();
    });

    it('should reject duplicate SKU', async () => {
      const productData1: CreateProductData = {
        name: 'Product 1',
        category: 'Coffee',
        sku: 'TEST-001',
        price: 5.00,
        vat_percentage: 10,
        stock_quantity: 50,
      };

      const productData2: CreateProductData = {
        name: 'Product 2',
        category: 'Tea',
        sku: 'TEST-001', // Same SKU
        price: 4.00,
        vat_percentage: 10,
        stock_quantity: 30,
      };

      await ProductService.createProduct(testCafeteriaId, testUserId, productData1);

      await expect(ProductService.createProduct(testCafeteriaId, testUserId, productData2))
        .rejects.toThrow('SKU already exists for this cafeteria');
    });

    it('should enforce product limit', async () => {
      // Create 50 products to reach the limit
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const productData: CreateProductData = {
          name: `Product ${i}`,
          category: 'Coffee',
          price: 1.00,
          vat_percentage: 10,
          stock_quantity: 10,
        };
        promises.push(ProductService.createProduct(testCafeteriaId, testUserId, productData));
      }
      await Promise.all(promises);

      // Try to create one more
      const productData: CreateProductData = {
        name: 'Product 51',
        category: 'Coffee',
        price: 1.00,
        vat_percentage: 10,
        stock_quantity: 10,
      };

      await expect(ProductService.createProduct(testCafeteriaId, testUserId, productData))
        .rejects.toThrow('Product limit reached');
    });
  });

  describe('getProducts', () => {
    beforeEach(async () => {
      // Create test products
      const products = [
        {
          id: uuidv4(),
          cafeteria_id: testCafeteriaId,
          name: 'Coffee',
          category: 'Coffee',
          price: 3.50,
          vat_percentage: 10,
          stock_quantity: 100,
          is_available: true,
          is_sold_out: false,
          created_by: testUserId,
          updated_by: testUserId,
        },
        {
          id: uuidv4(),
          cafeteria_id: testCafeteriaId,
          name: 'Tea',
          category: 'Tea',
          price: 2.50,
          vat_percentage: 10,
          stock_quantity: 50,
          is_available: true,
          is_sold_out: false,
          created_by: testUserId,
          updated_by: testUserId,
        },
        {
          id: uuidv4(),
          cafeteria_id: testCafeteriaId,
          name: 'Sandwich',
          category: 'Sandwiches',
          price: 6.00,
          vat_percentage: 10,
          stock_quantity: 20,
          is_available: false,
          is_sold_out: false,
          created_by: testUserId,
          updated_by: testUserId,
        },
      ];

      await db('products').insert(products);
    });

    it('should return paginated products', async () => {
      const result = await ProductService.getProducts(testCafeteriaId, { page: 1, limit: 2 });

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should filter by category', async () => {
      const result = await ProductService.getProducts(testCafeteriaId, { category: 'Coffee' });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Coffee');
    });

    it('should filter by availability', async () => {
      const result = await ProductService.getProducts(testCafeteriaId, { is_available: true });

      expect(result.products).toHaveLength(2);
      expect(result.products.every(p => p.is_available)).toBe(true);
    });

    it('should search by name', async () => {
      const result = await ProductService.getProducts(testCafeteriaId, { search: 'coffee' });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Coffee');
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      const productData: CreateProductData = {
        name: 'Test Product',
        category: 'Coffee',
        price: 3.00,
        vat_percentage: 10,
        stock_quantity: 100,
      };

      const createdProduct = await ProductService.createProduct(testCafeteriaId, testUserId, productData);
      const fetchedProduct = await ProductService.getProductById(createdProduct.id);

      expect(fetchedProduct.id).toBe(createdProduct.id);
      expect(fetchedProduct.name).toBe('Test Product');
    });

    it('should throw error for non-existent product', async () => {
      await expect(ProductService.getProductById(uuidv4()))
        .rejects.toThrow('Product not found');
    });
  });

  describe('updateProduct', () => {
    let productId: string;

    beforeEach(async () => {
      const productData: CreateProductData = {
        name: 'Original Product',
        category: 'Coffee',
        price: 3.00,
        vat_percentage: 10,
        stock_quantity: 100,
      };

      const product = await ProductService.createProduct(testCafeteriaId, testUserId, productData);
      productId = product.id;
    });

    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 4.00,
      };

      const updatedProduct = await ProductService.updateProduct(productId, testCafeteriaId, testUserId, updateData);

      expect(updatedProduct.name).toBe('Updated Product');
      expect(updatedProduct.price).toBe(4.00);
    });

    it('should reject duplicate SKU on update', async () => {
      // Create another product with a SKU
      const productData2: CreateProductData = {
        name: 'Product 2',
        category: 'Tea',
        sku: 'UNIQUE-SKU',
        price: 2.00,
        vat_percentage: 10,
        stock_quantity: 50,
      };

      await ProductService.createProduct(testCafeteriaId, testUserId, productData2);

      // Try to update first product with the same SKU
      const updateData = {
        sku: 'UNIQUE-SKU',
      };

      await expect(ProductService.updateProduct(productId, testCafeteriaId, testUserId, updateData))
        .rejects.toThrow('SKU already exists for this cafeteria');
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete product', async () => {
      const productData: CreateProductData = {
        name: 'Product to Delete',
        category: 'Coffee',
        price: 3.00,
        vat_percentage: 10,
        stock_quantity: 100,
      };

      const product = await ProductService.createProduct(testCafeteriaId, testUserId, productData);

      await ProductService.deleteProduct(product.id, testCafeteriaId, testUserId);

      // Product should still exist but be marked as unavailable
      const deletedProduct = await ProductService.getProductById(product.id);
      expect(deletedProduct.is_available).toBe(false);
    });
  });

  describe('getProductCategories', () => {
    beforeEach(async () => {
      const products = [
        {
          id: uuidv4(),
          cafeteria_id: testCafeteriaId,
          name: 'Coffee 1',
          category: 'Coffee',
          price: 3.50,
          vat_percentage: 10,
          stock_quantity: 100,
          is_available: true,
          is_sold_out: false,
          created_by: testUserId,
          updated_by: testUserId,
        },
        {
          id: uuidv4(),
          cafeteria_id: testCafeteriaId,
          name: 'Coffee 2',
          category: 'Coffee',
          price: 3.00,
          vat_percentage: 10,
          stock_quantity: 50,
          is_available: true,
          is_sold_out: false,
          created_by: testUserId,
          updated_by: testUserId,
        },
        {
          id: uuidv4(),
          cafeteria_id: testCafeteriaId,
          name: 'Tea',
          category: 'Tea',
          price: 2.50,
          vat_percentage: 10,
          stock_quantity: 30,
          is_available: true,
          is_sold_out: false,
          created_by: testUserId,
          updated_by: testUserId,
        },
      ];

      await db('products').insert(products);
    });

    it('should return unique categories', async () => {
      const categories = await ProductService.getProductCategories(testCafeteriaId);

      expect(categories).toContain('Coffee');
      expect(categories).toContain('Tea');
      expect(categories).toHaveLength(2);
    });
  });
});