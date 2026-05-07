import { Knex } from 'knex';
import { OrderModel, CreateOrderRequest, OrderWithItems, OrderFilters, OrderSummary, Order } from '../models/Order';
import { logger } from '../utils/logger';

export class OrderService {
  private orderModel: OrderModel;

  constructor(db: Knex) {
    this.orderModel = new OrderModel(db);
  }

  async createOrder(orderData: CreateOrderRequest): Promise<OrderWithItems> {
    try {
      logger.info('Creating new order', {
        cafeteria_id: orderData.cafeteria_id,
        customer_email: orderData.customer_email,
        item_count: orderData.items.length,
      });

      const order = await this.orderModel.create(orderData);

      logger.info('Order created successfully', {
        order_id: order.id,
        order_number: order.order_number,
        total: order.total,
      });

      return order;
    } catch (error) {
      logger.error('Failed to create order', {
        error: error.message,
        cafeteria_id: orderData.cafeteria_id,
        customer_email: orderData.customer_email,
      });
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<OrderWithItems | null> {
    try {
      const order = await this.orderModel.findById(orderId);

      if (order) {
        logger.info('Order retrieved', { order_id: orderId });
      } else {
        logger.warn('Order not found', { order_id: orderId });
      }

      return order;
    } catch (error) {
      logger.error('Failed to get order', { order_id: orderId, error: error.message });
      throw error;
    }
  }

  async getOrders(cafeteriaId: string, filters: OrderFilters = {}) {
    try {
      const result = await this.orderModel.findByCafeteria(cafeteriaId, filters);

      logger.info('Orders retrieved', {
        cafeteria_id: cafeteriaId,
        count: result.orders.length,
        total: result.total,
        filters,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get orders', {
        cafeteria_id: cafeteriaId,
        error: error.message,
        filters,
      });
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: Order['order_status'], userId?: string): Promise<Order> {
    try {
      // Validate status transition
      await this.validateStatusTransition(orderId, status);

      const order = await this.orderModel.updateStatus(orderId, status);

      logger.info('Order status updated', {
        order_id: orderId,
        old_status: order.order_status,
        new_status: status,
        user_id: userId,
      });

      // Update inventory if order is completed
      if (status === 'completed') {
        await this.updateInventoryForOrder(orderId);
      }

      return order;
    } catch (error) {
      logger.error('Failed to update order status', {
        order_id: orderId,
        status,
        error: error.message,
      });
      throw error;
    }
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: Order['payment_status'],
    stripePaymentIntentId?: string
  ): Promise<Order> {
    try {
      const order = await this.orderModel.updatePaymentStatus(orderId, paymentStatus, stripePaymentIntentId);

      logger.info('Order payment status updated', {
        order_id: orderId,
        payment_status: paymentStatus,
        stripe_payment_intent_id: stripePaymentIntentId,
      });

      // If payment is successful, update order status to paid
      if (paymentStatus === 'paid' && order.order_status === 'new') {
        await this.updateOrderStatus(orderId, 'paid');
      }

      return order;
    } catch (error) {
      logger.error('Failed to update payment status', {
        order_id: orderId,
        payment_status: paymentStatus,
        error: error.message,
      });
      throw error;
    }
  }

  async cancelOrder(orderId: string, reason?: string, userId?: string): Promise<Order> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.order_status !== 'new' && order.order_status !== 'paid') {
        throw new Error('Order cannot be cancelled at this stage');
      }

      const cancelledOrder = await this.orderModel.updateStatus(orderId, 'cancelled');

      logger.info('Order cancelled', {
        order_id: orderId,
        reason,
        user_id: userId,
      });

      return cancelledOrder;
    } catch (error) {
      logger.error('Failed to cancel order', {
        order_id: orderId,
        error: error.message,
      });
      throw error;
    }
  }

  async getOrderSummary(cafeteriaId: string, date?: Date): Promise<OrderSummary> {
    try {
      const summary = await this.orderModel.getSummary(cafeteriaId, date);

      logger.info('Order summary retrieved', {
        cafeteria_id: cafeteriaId,
        date: date?.toISOString(),
        summary,
      });

      return summary;
    } catch (error) {
      logger.error('Failed to get order summary', {
        cafeteria_id: cafeteriaId,
        error: error.message,
      });
      throw error;
    }
  }

  private async validateStatusTransition(orderId: string, newStatus: Order['order_status']): Promise<void> {
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const currentStatus = order.order_status;
    const validTransitions: Record<string, string[]> = {
      new: ['paid', 'cancelled'],
      paid: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['completed'],
      completed: [], // Terminal state
      cancelled: [], // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async updateInventoryForOrder(orderId: string): Promise<void> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) return;

      const trx = await this.orderModel['db'].transaction();

      try {
        for (const item of order.items) {
          // Decrease product stock
          await trx('products')
            .where('id', item.product_id)
            .decrement('stock_quantity', item.quantity);

          // Record inventory adjustment
          await trx('inventory_adjustments').insert({
            cafeteria_id: order.cafeteria_id,
            product_id: item.product_id,
            quantity_change: -item.quantity,
            reason: 'sold',
            notes: `Order ${order.order_number}`,
          });
        }

        await trx.commit();
        logger.info('Inventory updated for completed order', { order_id: orderId });
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('Failed to update inventory for order', {
        order_id: orderId,
        error: error.message,
      });
      throw error;
    }
  }
}