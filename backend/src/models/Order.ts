import { Knex } from 'knex';

export interface Order {
  id: string;
  cafeteria_id: string;
  order_number: string;
  customer_email: string;
  customer_name?: string;
  order_type: 'dine_in' | 'takeaway' | 'preorder' | 'pickup';
  notes?: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'new' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  stripe_payment_intent_id?: string;
  paid_at?: Date;
  completed_at?: Date;
  cancelled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  vat_percentage: number;
  line_total: number;
  add_ons?: Array<{ name: string; price: number }>;
  notes?: string;
  created_at: Date;
}

export interface CreateOrderRequest {
  cafeteria_id: string;
  customer_email: string;
  customer_name?: string;
  order_type: 'dine_in' | 'takeaway' | 'preorder' | 'pickup';
  notes?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    add_ons?: Array<{ name: string; price: number }>;
    notes?: string;
  }>;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface OrderFilters {
  cafeteria_id?: string;
  customer_email?: string;
  order_status?: string;
  payment_status?: string;
  order_type?: string;
  date_from?: Date;
  date_to?: Date;
  page?: number;
  limit?: number;
}

export interface OrderSummary {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  completed_today: number;
}

export class OrderModel {
  constructor(private db: Knex) {}

  async create(orderData: CreateOrderRequest): Promise<OrderWithItems> {
    const trx = await this.db.transaction();

    try {
      // Generate order number
      const orderNumber = await this.generateOrderNumber(orderData.cafeteria_id, trx);

      // Calculate totals
      const { subtotal, vat_amount, total, items } = await this.calculateOrderTotals(
        orderData.items,
        orderData.cafeteria_id,
        trx
      );

      // Create order
      const [order] = await trx('orders')
        .insert({
          cafeteria_id: orderData.cafeteria_id,
          order_number: orderNumber,
          customer_email: orderData.customer_email,
          customer_name: orderData.customer_name,
          order_type: orderData.order_type,
          notes: orderData.notes,
          subtotal,
          vat_amount,
          total,
          payment_status: 'pending',
          order_status: 'new',
        })
        .returning('*');

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_percentage: item.vat_percentage,
        line_total: item.line_total,
        add_ons: item.add_ons,
        notes: item.notes,
      }));

      const insertedItems = await trx('order_items')
        .insert(orderItems)
        .returning('*');

      await trx.commit();

      return {
        ...order,
        items: insertedItems,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async findById(orderId: string): Promise<OrderWithItems | null> {
    const order = await this.db('orders')
      .where('id', orderId)
      .first();

    if (!order) return null;

    const items = await this.db('order_items')
      .where('order_id', orderId)
      .orderBy('created_at');

    return {
      ...order,
      items,
    };
  }

  async findByCafeteria(cafeteriaId: string, filters: OrderFilters = {}): Promise<{ orders: OrderWithItems[]; total: number }> {
    const query = this.db('orders')
      .where('cafeteria_id', cafeteriaId);

    // Apply filters
    if (filters.customer_email) {
      query.where('customer_email', 'ilike', `%${filters.customer_email}%`);
    }
    if (filters.order_status) {
      query.where('order_status', filters.order_status);
    }
    if (filters.payment_status) {
      query.where('payment_status', filters.payment_status);
    }
    if (filters.order_type) {
      query.where('order_type', filters.order_type);
    }
    if (filters.date_from) {
      query.where('created_at', '>=', filters.date_from);
    }
    if (filters.date_to) {
      query.where('created_at', '<=', filters.date_to);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const [orders, [{ count }]] = await Promise.all([
      query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      query.clone().count('* as count'),
    ]);

    // Load items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await this.db('order_items')
          .where('order_id', order.id)
          .orderBy('created_at');
        return { ...order, items };
      })
    );

    return {
      orders: ordersWithItems,
      total: parseInt(count as string, 10),
    };
  }

  async updateStatus(orderId: string, status: Order['order_status'], userId?: string): Promise<Order> {
    const updateData: any = {
      order_status: status,
      updated_at: this.db.fn.now(),
    };

    // Set timestamps based on status
    if (status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = this.db.fn.now();
    } else if (status === 'cancelled' && !updateData.cancelled_at) {
      updateData.cancelled_at = this.db.fn.now();
    }

    const [order] = await this.db('orders')
      .where('id', orderId)
      .update(updateData)
      .returning('*');

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async updatePaymentStatus(orderId: string, paymentStatus: Order['payment_status'], stripePaymentIntentId?: string): Promise<Order> {
    const updateData: any = {
      payment_status: paymentStatus,
      updated_at: this.db.fn.now(),
    };

    if (stripePaymentIntentId) {
      updateData.stripe_payment_intent_id = stripePaymentIntentId;
    }

    if (paymentStatus === 'paid' && !updateData.paid_at) {
      updateData.paid_at = this.db.fn.now();
    }

    const [order] = await this.db('orders')
      .where('id', orderId)
      .update(updateData)
      .returning('*');

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async getSummary(cafeteriaId: string, date?: Date): Promise<OrderSummary> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [summary] = await this.db('orders')
      .where('cafeteria_id', cafeteriaId)
      .select(
        this.db.raw('COUNT(*) as total_orders'),
        this.db.raw('SUM(total) as total_revenue'),
        this.db.raw('COUNT(CASE WHEN order_status IN (\'new\', \'paid\', \'preparing\') THEN 1 END) as pending_orders'),
        this.db.raw('COUNT(CASE WHEN order_status = \'completed\' AND completed_at >= ? AND completed_at <= ? THEN 1 END) as completed_today', [startOfDay, endOfDay])
      );

    return {
      total_orders: parseInt(summary.total_orders, 10),
      total_revenue: parseFloat(summary.total_revenue || 0),
      pending_orders: parseInt(summary.pending_orders, 10),
      completed_today: parseInt(summary.completed_today, 10),
    };
  }

  private async generateOrderNumber(cafeteriaId: string, trx: Knex.Transaction): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const prefix = `ORD-${today}-`;

    // Find the highest order number for today
    const [lastOrder] = await trx('orders')
      .where('cafeteria_id', cafeteriaId)
      .where('order_number', 'like', `${prefix}%`)
      .orderBy('order_number', 'desc')
      .limit(1)
      .select('order_number');

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.order_number.split('-').pop() || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(3, '0')}`;
  }

  private async calculateOrderTotals(
    items: CreateOrderRequest['items'],
    cafeteriaId: string,
    trx: Knex.Transaction
  ): Promise<{
    subtotal: number;
    vat_amount: number;
    total: number;
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      vat_percentage: number;
      line_total: number;
      add_ons?: Array<{ name: string; price: number }>;
      notes?: string;
    }>;
  }> {
    let subtotal = 0;
    let vat_amount = 0;

    const processedItems = await Promise.all(
      items.map(async (item) => {
        const product = await trx('products')
          .where('id', item.product_id)
          .where('cafeteria_id', cafeteriaId)
          .whereNull('deleted_at')
          .first();

        if (!product) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const unit_price = product.price;
        const line_subtotal = unit_price * item.quantity;
        const line_vat = (line_subtotal * product.vat_percentage) / 100;
        const line_total = line_subtotal + line_vat;

        subtotal += line_subtotal;
        vat_amount += line_vat;

        return {
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          unit_price,
          vat_percentage: product.vat_percentage,
          line_total,
          add_ons: item.add_ons,
          notes: item.notes,
        };
      })
    );

    const total = subtotal + vat_amount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vat_amount: Math.round(vat_amount * 100) / 100,
      total: Math.round(total * 100) / 100,
      items: processedItems,
    };
  }
}