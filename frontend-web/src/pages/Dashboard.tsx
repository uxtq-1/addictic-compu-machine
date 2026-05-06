import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Cafeteria Lite</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">Settings</button>
              <button className="text-gray-600 hover:text-gray-900">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h2>
            <p className="text-gray-600">
              Dashboard content coming in Phase 1. Features:
            </p>
            <ul className="list-disc list-inside mt-4 text-gray-600">
              <li>Product Management</li>
              <li>Order Overview</li>
              <li>Inventory Tracking</li>
              <li>Daily Reports</li>
              <li>Staff Management</li>
              <li>Billing Settings</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};
