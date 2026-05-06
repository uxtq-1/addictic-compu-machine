import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Products table
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.string('name').notNullable();
    table.text('description').nullable();
    table.string('category').notNullable(); // coffee, tea, cold drinks, etc
    table.string('sku').nullable();
    table.decimal('price', 10, 2).notNullable();
    table.decimal('vat_percentage', 5, 2).notNullable().defaultTo(0);
    table.integer('stock_quantity').notNullable().defaultTo(0);
    table.boolean('is_available').notNullable().defaultTo(true);
    table.boolean('is_sold_out').notNullable().defaultTo(false);
    table.string('image_url').nullable();
    table.boolean('is_featured').notNullable().defaultTo(false);
    table.jsonb('availability_schedule').nullable(); // { available_from: "09:00", available_to: "11:00", days: [] }
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.index(['cafeteria_id']);
    table.index(['category']);
    table.index(['is_available']);
  });

  // Product images (for products with multiple images)
  await knex.schema.createTable('product_images', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.string('image_url').notNullable();
    table.integer('position').notNullable().defaultTo(0); // Order of images
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['product_id']);
  });

  // Product add-ons/modifiers
  await knex.schema.createTable('product_add_ons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.string('name').notNullable(); // e.g., "Extra cheese", "Oat milk"
    table.decimal('price', 10, 2).notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['product_id']);
  });

  // Combos (bundled products)
  await knex.schema.createTable('combos', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.string('name').notNullable();
    table.text('description').nullable();
    table.decimal('price', 10, 2).notNullable();
    table.decimal('vat_percentage', 5, 2).notNullable().defaultTo(0);
    table.string('image_url').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['cafeteria_id']);
  });

  // Combo items (products in a combo)
  await knex.schema.createTable('combo_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('combo_id').notNullable().references('id').inTable('combos').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.integer('quantity').notNullable().defaultTo(1);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['combo_id']);
  });

  // Categories (for organization)
  await knex.schema.createTable('product_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.string('name').notNullable(); // coffee, tea, cold drinks, etc
    table.string('icon').nullable();
    table.integer('position').notNullable().defaultTo(0);
    table.boolean('is_enabled').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['cafeteria_id', 'name']);
    table.index(['cafeteria_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('combo_items');
  await knex.schema.dropTableIfExists('combos');
  await knex.schema.dropTableIfExists('product_categories');
  await knex.schema.dropTableIfExists('product_add_ons');
  await knex.schema.dropTableIfExists('product_images');
  await knex.schema.dropTableIfExists('products');
}
