import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Audit logs (immutable)
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable();
    table.string('action').notNullable(); // POST, PUT, DELETE
    table.string('resource_type').notNullable(); // products, orders, users, etc
    table.uuid('resource_id').nullable();
    table.string('ip_address').nullable();
    table.string('request_path').notNullable();
    table.string('request_method').notNullable();
    table.integer('response_status').notNullable();
    table.text('request_body').nullable(); // Sanitized, sensitive data redacted
    table.jsonb('changes').nullable(); // For PUT: { old_value, new_value } for changed fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['resource_type']);
    table.index(['resource_id']);
    table.index('created_at');
  });

  // Reports (daily summaries)
  await knex.schema.createTable('reports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.string('report_type').notNullable(); // daily, weekly, monthly
    table.date('report_date').notNullable();
    table.integer('total_orders').notNullable().defaultTo(0);
    table.integer('completed_orders').notNullable().defaultTo(0);
    table.decimal('total_revenue', 12, 2).notNullable().defaultTo(0);
    table.decimal('vat_collected', 12, 2).notNullable().defaultTo(0);
    table.jsonb('top_products').nullable(); // { product_id, name, quantity, revenue }
    table.jsonb('low_stock_items').nullable(); // Products below threshold
    table.jsonb('order_breakdown').nullable(); // By type: dine-in, takeaway, etc
    table.boolean('email_sent').notNullable().defaultTo(false);
    table.timestamp('sent_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['cafeteria_id']);
    table.index('report_date');
    table.unique(['cafeteria_id', 'report_type', 'report_date']);
  });

  // Notifications (for real-time alerts)
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.string('type').notNullable(); // new_order, low_stock, payment_received, etc
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('data').nullable(); // Additional context: order_id, product_id, etc
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id']);
    table.index(['is_read']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('reports');
  await knex.schema.dropTableIfExists('audit_logs');
}
