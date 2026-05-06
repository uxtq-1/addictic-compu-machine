import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('name').notNullable();
    table.uuid('firebase_uid').unique().notNullable();
    table.uuid('cafeteria_id').nullable();
    table.string('role').notNullable().defaultTo('staff'); // owner, admin, staff, cashier
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['cafeteria_id']);
    table.index(['is_active']);
  });

  // Roles table
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').unique().notNullable(); // owner, admin, staff, cashier
    table.text('description').nullable();
    table.jsonb('permissions').notNullable().defaultTo('{}'); // JSON-based permissions
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // Cafeteria profiles
  await knex.schema.createTable('cafeteria_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('owner_id').notNullable().references('id').inTable('users');
    table.string('name').notNullable();
    table.text('description').nullable();
    table.string('logo_url').nullable();
    table.string('address').nullable();
    table.string('city').nullable();
    table.string('postal_code').nullable();
    table.string('country').nullable();
    table.string('phone').nullable();
    table.decimal('default_vat_percentage', 5, 2).notNullable().defaultTo(0);
    table.jsonb('opening_hours').nullable(); // { monday: "09:00-17:00", ... }
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['owner_id']);
    table.index(['is_active']);
  });

  // Subscriptions
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.string('stripe_customer_id').nullable();
    table.string('stripe_subscription_id').nullable();
    table.string('plan').notNullable().defaultTo('lite-professional'); // lite-professional, professional, etc
    table.string('status').notNullable().defaultTo('active'); // active, cancelled, suspended
    table.timestamp('current_period_start').nullable();
    table.timestamp('current_period_end').nullable();
    table.timestamp('next_billing_date').nullable();
    table.timestamp('cancelled_at').nullable();
    table.jsonb('plan_limits').notNullable().defaultTo('{}'); // { products: 50, images: 100, users: 5 }
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['cafeteria_id']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('cafeteria_profiles');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
}
