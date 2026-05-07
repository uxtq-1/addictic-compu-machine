import React, { useEffect, useMemo, useState } from 'react';
import { CreateProductRequest, Product } from '../services/productApi';

interface ProductFormProps {
  product?: Product | null;
  categories: string[];
  onSave: (data: CreateProductRequest, image?: File | null) => Promise<void>;
  onCancel: () => void;
}

const defaultValues: CreateProductRequest = {
  name: '',
  description: '',
  category: '',
  sku: '',
  price: 0,
  vat_percentage: 0,
  stock_quantity: 0,
  is_available: true,
  is_sold_out: false,
  is_featured: false,
};

export const ProductForm: React.FC<ProductFormProps> = ({ product, categories, onSave, onCancel }) => {
  const [formValues, setFormValues] = useState<CreateProductRequest>(defaultValues);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormValues({
        name: product.name,
        description: product.description || '',
        category: product.category,
        sku: product.sku || '',
        price: product.price,
        vat_percentage: product.vat_percentage,
        stock_quantity: product.stock_quantity,
        is_available: product.is_available,
        is_sold_out: product.is_sold_out,
        image_url: product.image_url || null,
        is_featured: product.is_featured,
        availability_schedule: product.availability_schedule,
      });
    } else {
      setFormValues(defaultValues);
      setImageFile(null);
    }
  }, [product]);

  const title = product ? 'Edit Product' : 'Create Product';
  const buttonLabel = product ? 'Update Product' : 'Create Product';

  const handleChange = (field: keyof CreateProductRequest, value: any) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!formValues.name.trim()) {
      setError('Product name is required.');
      setLoading(false);
      return;
    }

    if (!formValues.category) {
      setError('Please select a category.');
      setLoading(false);
      return;
    }

    if (formValues.price <= 0) {
      setError('Price must be greater than zero.');
      setLoading(false);
      return;
    }

    if (formValues.stock_quantity < 0) {
      setError('Stock quantity cannot be negative.');
      setLoading(false);
      return;
    }

    try {
      await onSave(formValues, imageFile);
    } catch (saveError: any) {
      console.error(saveError);
      setError(saveError?.message || 'Unable to save product.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(
    () => categories.length ? categories : ['Coffee', 'Tea', 'Cold Drinks', 'Sandwiches', 'Pastries', 'Desserts', 'Breakfast', 'Combos'],
    [categories]
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              type="text"
              value={formValues.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Category</span>
            <select
              value={formValues.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select category</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formValues.price}
              onChange={(e) => handleChange('price', Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">VAT %</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formValues.vat_percentage}
              onChange={(e) => handleChange('vat_percentage', Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            value={formValues.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">SKU</span>
            <input
              type="text"
              value={formValues.sku || ''}
              onChange={(e) => handleChange('sku', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Stock Quantity</span>
            <input
              type="number"
              min="0"
              value={formValues.stock_quantity}
              onChange={(e) => handleChange('stock_quantity', Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Availability</span>
            <select
              value={formValues.is_available ? 'available' : 'unavailable'}
              onChange={(e) => handleChange('is_available', e.target.value === 'available')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Product Image</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-700"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : buttonLabel}
          </button>
        </div>
      </form>
    </div>
  );
};
