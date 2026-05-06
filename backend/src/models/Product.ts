import { db } from '../utils/database';
import { logger } from '../utils/logger';

export interface ProductData {
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
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

export class Product {
  public readonly id: string;
  public readonly cafeteria_id: string;
  public name: string;
  public description?: string;
  public category: string;
  public sku?: string;
  public price: number;
  public vat_percentage: number;
  public stock_quantity: number;
  public is_available: boolean;
  public is_sold_out: boolean;
  public image_url?: string | null;
  public is_featured: boolean;
  public availability_schedule?: any;
  public readonly created_at: Date;
  public updated_at: Date;
  public readonly created_by: string;
  public updated_by: string;

  constructor(data: ProductData) {
    this.id = data.id;
    this.cafeteria_id = data.cafeteria_id;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.sku = data.sku;
    this.price = data.price;
    this.vat_percentage = data.vat_percentage;
    this.stock_quantity = data.stock_quantity;
    this.is_available = data.is_available;
    this.is_sold_out = data.is_sold_out;
    this.image_url = data.image_url;
    this.is_featured = data.is_featured;
    this.availability_schedule = data.availability_schedule;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  /**
   * Create a Product instance from database row
   */
  static fromDatabase(data: any): Product {
    return new Product({
      id: data.id,
      cafeteria_id: data.cafeteria_id,
      name: data.name,
      description: data.description,
      category: data.category,
      sku: data.sku,
      price: parseFloat(data.price),
      vat_percentage: parseFloat(data.vat_percentage),
      stock_quantity: data.stock_quantity,
      is_available: data.is_available,
      is_sold_out: data.is_sold_out,
      image_url: data.image_url,
      is_featured: data.is_featured,
      availability_schedule: data.availability_schedule,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      created_by: data.created_by,
      updated_by: data.updated_by,
    });
  }

  /**
   * Convert to plain object for API responses
   */
  toJSON(): ProductData {
    return {
      id: this.id,
      cafeteria_id: this.cafeteria_id,
      name: this.name,
      description: this.description,
      category: this.category,
      sku: this.sku,
      price: this.price,
      vat_percentage: this.vat_percentage,
      stock_quantity: this.stock_quantity,
      is_available: this.is_available,
      is_sold_out: this.is_sold_out,
      image_url: this.image_url,
      is_featured: this.is_featured,
      availability_schedule: this.availability_schedule,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
    };
  }

  /**
   * Check if product is currently available for ordering
   */
  isCurrentlyAvailable(): boolean {
    if (!this.is_available || this.is_sold_out) {
      return false;
    }

    // Check availability schedule if present
    if (this.availability_schedule) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      const { available_from, available_to, days } = this.availability_schedule;

      if (available_from && available_to) {
        if (currentTime < available_from || currentTime > available_to) {
          return false;
        }
      }

      if (days && days.length > 0) {
        if (!days.includes(currentDay)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calculate price including VAT
   */
  getPriceWithVat(): number {
    return this.price * (1 + this.vat_percentage / 100);
  }
}