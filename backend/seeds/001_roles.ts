import { Knex } from 'knex';

const DEFAULT_ROLES = [
  {
    name: 'owner',
    description: 'Business owner with full access',
    permissions: {
      'product:read': true,
      'product:write': true,
      'product:delete': true,
      'order:read': true,
      'order:write': true,
      'order:delete': true,
      'inventory:read': true,
      'inventory:write': true,
      'invoice:read': true,
      'invoice:write': true,
      'user:manage': true,
      'reports:read': true,
      'billing:manage': true,
      'settings:manage': true,
    },
  },
  {
    name: 'admin',
    description: 'Admin can manage products, orders, and inventory',
    permissions: {
      'product:read': true,
      'product:write': true,
      'order:read': true,
      'order:write': true,
      'inventory:read': true,
      'inventory:write': true,
      'invoice:read': true,
      'reports:read': true,
    },
  },
  {
    name: 'staff',
    description: 'Staff can view orders and update status',
    permissions: {
      'order:read': true,
      'order:write': true,
      'inventory:read': true,
      'reports:read': true,
    },
  },
  {
    name: 'cashier',
    description: 'Cashier can process sales',
    permissions: {
      'product:read': true,
      'order:write': true,
    },
  },
];

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('roles').del();

  // Inserts seed entries
  await knex('roles').insert(DEFAULT_ROLES);
}
