import React from 'react';
import { AdminLayout } from '../components/AdminLayout';

export const Dashboard: React.FC = () => {
  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Total Products</h2>
          <p className="mt-4 text-3xl font-bold text-blue-600">—</p>
          <p className="mt-2 text-sm text-gray-500">Create and manage cafeteria products.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Open Orders</h2>
          <p className="mt-4 text-3xl font-bold text-indigo-600">—</p>
          <p className="mt-2 text-sm text-gray-500">Track your active orders and fulfilment status.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Inventory Status</h2>
          <p className="mt-4 text-3xl font-bold text-green-600">—</p>
          <p className="mt-2 text-sm text-gray-500">Monitor stock levels and low inventory alerts.</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Phase 1 Focus</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700">Product CRUD</p>
            <p className="mt-2 text-sm text-gray-500">Create, update, and soft delete products with validation.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700">Image Upload</p>
            <p className="mt-2 text-sm text-gray-500">Upload product images and maintain URLs safely.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700">Category Management</p>
            <p className="mt-2 text-sm text-gray-500">Filter products by category and manage availability.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700">Admin Productivity</p>
            <p className="mt-2 text-sm text-gray-500">Build the admin dashboard and product management workflow.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
