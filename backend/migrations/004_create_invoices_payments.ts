import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Invoices
  await knex.schema.createTable('invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.uuid('order_id').notNullable().references('id').inTable('orders');
    table.string('invoice_number').unique().notNullable(); // INV-20230501-001
    table.string('customer_email').notNullable();
    table.string('customer_name').nullable();
    table.text('invoice_html').nullable(); // Store rendered HTML for PDF regeneration
    table.string('pdf_url').nullable(); // URL to stored PDF in Firebase Storage
    table.decimal('subtotal', 12, 2).notNullable();
    table.decimal('vat_amount', 12, 2).notNullable();
    table.decimal('total', 12, 2).notNullable();
    table.boolean('sent_to_customer').notNullable().defaultTo(false);
    table.timestamp('sent_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['cafeteria_id']);
    table.index(['order_id']);
    table.index(['customer_email']);
  });

  // Payments (Stripe payment records)
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable().references('id').inTable('orders');
    table.uuid('cafeteria_id').notNullable().references('id').inTable('cafeteria_profiles');
    table.string('stripe_payment_intent_id').unique().notNullable();
    table.string('stripe_customer_id').nullable();
    table.string('status').notNullable(); // succeeded, pending, failed, cancelled
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency').notNullable().defaultTo('usd');
    table.string('payment_method').nullable(); // card, ideal, etc
    table.text('stripe_response').nullable(); // Store full Stripe response for debugging
    table.timestamp('processed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['order_id']);
    table.index(['cafeteria_id']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('invoices');
}
