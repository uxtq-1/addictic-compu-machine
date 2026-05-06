import { db } from '../utils/database';

// Setup test database
beforeAll(async () => {
  // Ensure we're using test database
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/cafeteria_test';

  // Run migrations for test database
  await db.migrate.latest();
});

afterAll(async () => {
  // Close database connection
  await db.destroy();
});

beforeEach(async () => {
  // Clean up tables before each test
  await db('audit_logs').del();
  await db('product_images').del();
  await db('product_add_ons').del();
  await db('products').del();
  await db('users').del();
  await db('cafeteria_profiles').del();
});