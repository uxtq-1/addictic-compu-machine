import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Orders table
  await knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.string('order_number').unique().notNullable(); // Auto-generated: ORD-20230501-001
    table.string('customer_email').notNullable();
    table.string('customer_name').nullable();
    table.string('order_type').notNullable(); // dine-in, takeaway, preorder, pickup
    table.text('notes').nullable();
    table.decimal('subtotal', 12, 2).notNullable();
    table.decimal('vat_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('total', 12, 2).notNullable();
    table.string('payment_status').notNullable().defaultTo('pending'); // pending, paid, failed, refunded
    table.string('order_status').notNullable().defaultTo('new'); // new, paid, preparing, ready, completed, cancelled
    table.string('stripe_payment_intent_id').nullable();
    table.timestamp('paid_at').nullable();
    table.timestamp('completed_at').nullable();
    table.timestamp('cancelled_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['cafeteria_id']);
    table.index(['payment_status']);
    table.index(['order_status']);
    table.index(['customer_email']);
    table.index('created_at');
  });

  // Order items (line items in an order)
  await knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.string('product_name').notNullable();
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('vat_percentage', 5, 2).notNullable().defaultTo(0);
    table.decimal('line_total', 12, 2).notNullable();
    table.jsonb('add_ons').nullable(); // [{ name: "extra cheese", price: 1.00 }]
    table.text('notes').nullable(); // e.g., "no sugar", "extra hot"
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id']);
    table.index(['product_id']);
  });

  // Inventory tracking
  await knex.schema.createTable('inventory', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.integer('quantity_on_hand').notNullable().defaultTo(0);
    table.integer('quantity_sold_today').notNullable().defaultTo(0);
    table.integer('quantity_reserved').notNullable().defaultTo(0);
    table.timestamp('last_counted_at').nullable();
    table.uuid('last_counted_by').references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['cafeteria_id', 'product_id']);
    table.index(['cafeteria_id']);
  });

  // Inventory adjustments (audit trail)
  await knex.schema.createTable('inventory_adjustments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.integer('quantity_change').notNullable();
    table.string('reason').notNullable(); // sold, loss, recount, manual_adjustment
    table.text('notes').nullable();
    table.uuid('adjusted_by').references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['cafeteria_id']);
    table.index(['product_id']);
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('inventory_adjustments');
  await knex.schema.dropTableIfExists('inventory');
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
}
