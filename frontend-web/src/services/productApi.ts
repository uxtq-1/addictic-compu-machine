import api from './api';

export interface Product {
  id: string;
  cafeteria_id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  price: number;
  vat_percentage: number;
  stock_quantity: number;
  is_available: boolean;
  is_sold_out: boolean;
  image_url?: string | null;
  is_featured: boolean;
  availability_schedule?: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  category: string;
  sku?: string;
  price: number;
  vat_percentage: number;
  stock_quantity: number;
  is_available?: boolean;
  is_sold_out?: boolean;
  image_url?: string | null;
  is_featured?: boolean;
  availability_schedule?: any;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    total: number;
    page: number;
    limit: number;
  };
  timestamp: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product;
  timestamp: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Array<{
    name: string;
    available: boolean;
  }>;
  timestamp: string;
}

export const productApi = {
  // Get products with filters
  getProducts: (
    cafeteriaId: string,
    filters?: {
      category?: string;
      is_available?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const params = new URLSearchParams({
      cafeteria_id: cafeteriaId,
      ...Object.fromEntries(
        Object.entries(filters || {}).filter(([, v]) => v !== undefined)
      ),
    });
    return api.get<ProductsResponse>(`/products?${params}`);
  },

  // Get single product
  getProduct: (productId: string) => {
    return api.get<ProductResponse>(`/products/${productId}`);
  },

  // Create product
  createProduct: (cafeteriaId: string, data: CreateProductRequest) => {
    return api.post<ProductResponse>('/products', {
      ...data,
      cafeteria_id: cafeteriaId,
    });
  },

  // Update product
  updateProduct: (productId: string, data: UpdateProductRequest) => {
    return api.put<ProductResponse>(`/products/${productId}`, data);
  },

  // Delete product (soft delete)
  deleteProduct: (productId: string) => {
    return api.delete(`/products/${productId}`);
  },

  // Upload product image
  uploadImage: (productId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ProductResponse>(`/products/${productId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get categories
  getCategories: (cafeteriaId: string) => {
    return api.get<CategoriesResponse>(`/categories?cafeteria_id=${cafeteriaId}`);
  },
};

export default productApi;
