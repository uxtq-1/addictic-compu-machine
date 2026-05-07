import React, { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { ProductForm } from '../components/ProductForm';
import { CreateProductRequest, Product, productApi } from '../services/productApi';

const DEFAULT_CAFETERIA_ID = process.env.REACT_APP_CAFETERIA_ID || 'default';

const defaultCategories = [
  'Coffee',
  'Tea',
  'Cold Drinks',
  'Sandwiches',
  'Pastries',
  'Desserts',
  'Breakfast',
  'Combos',
];

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchCategories = async () => {
    try {
      const response = await productApi.getCategories(DEFAULT_CAFETERIA_ID);
      const categoryNames = response.data.data.map((item) => item.name);
      if (categoryNames.length) {
        setCategories(categoryNames);
      }
    } catch (err) {
      console.warn('Unable to load categories, using defaults', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await productApi.getProducts(DEFAULT_CAFETERIA_ID, {
        category: categoryFilter || undefined,
        search: search || undefined,
        page,
        limit,
      });

      setProducts(response.data.data.products);
      setTotal(response.data.data.total);
    } catch (fetchError: any) {
      console.error(fetchError);
      setError(fetchError?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, search]);

  const openCreateForm = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const closeForm = () => {
    setSelectedProduct(null);
    setShowForm(false);
  };

  const handleSaveProduct = async (data: CreateProductRequest, image?: File | null) => {
    setLoading(true);
    setError('');

    try {
      let createdProduct: Product;

      if (selectedProduct) {
        const response = await productApi.updateProduct(selectedProduct.id, data);
        createdProduct = response.data.data;
      } else {
        const response = await productApi.createProduct(DEFAULT_CAFETERIA_ID, data);
        createdProduct = response.data.data;
      }

      if (image && createdProduct?.id) {
        await productApi.uploadImage(createdProduct.id, image);
      }

      await fetchProducts();
      closeForm();
    } catch (saveError: any) {
      console.error(saveError);
      setError(saveError?.message || 'Unable to save product.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Delete this product? This is a soft delete.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await productApi.deleteProduct(productId);
      await fetchProducts();
    } catch (deleteError: any) {
      console.error(deleteError);
      setError(deleteError?.message || 'Unable to delete product.');
    } finally {
      setLoading(false);
    }
  };

  const pageCount = useMemo(() => Math.ceil(total / limit), [total, limit]);

  return (
    <AdminLayout title="Products">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Product
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    {loading ? 'Loading products...' : 'No products found.'}
                  </td>
                </tr>
              )}

              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-4 text-sm text-gray-900">{product.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{product.category}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{product.stock_quantity}</td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        product.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border border-t-0 border-gray-200 rounded-b-lg">
            <span className="text-sm text-gray-700">
              Page {page} of {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={page === pageCount}
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-xl">
            <ProductForm
              product={selectedProduct}
              categories={categories}
              onSave={handleSaveProduct}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
