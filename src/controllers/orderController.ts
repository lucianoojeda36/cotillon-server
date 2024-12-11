import { Request, Response } from 'express';
import pool from '../config/database';

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user_id, total } = req.body;

    if (!user_id || !total) {
      res
        .status(400)
        .json({ message: 'User ID and total amount are required' });
      return;
    }

    const status = 'pending';

    const result = await pool.query(
      'INSERT INTO orders (user_id, status, total) VALUES ($1, $2, $3) RETURNING *',
      [user_id, status, total],
    );

    const createdOrder = result.rows[0];
    res.status(201).json({
      message: 'Order created successfully',
      order: createdOrder,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { order_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [order_id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const order = result.rows[0];
    if (order.status !== 'pending') {
      res.status(400).json({ message: 'Order already processed' });
      return;
    }

    res.status(200).json({ message: 'Order is valid for processing', order });
  } catch (error) {
    console.error('Error verifying order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const processPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { order_id, payment_details } = req.body;

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
      ['paid', order_id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.status(200).json({
      message: 'Payment processed successfully',
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const shipOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { order_id } = req.params;

    const result = await pool.query(
      'UPDATE orders SET status = $1, shipped_at = NOW() WHERE order_id = $2 RETURNING *',
      ['shipped', order_id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res
      .status(200)
      .json({ message: 'Order shipped successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Error shipping order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { order_id } = req.params;

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
      ['cancelled', order_id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res
      .status(200)
      .json({ message: 'Order cancelled successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const completeOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { order_id } = req.params;

    const result = await pool.query(
      'UPDATE orders SET status = $1, completed_at = NOW() WHERE order_id = $2 RETURNING *',
      ['completed', order_id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res
      .status(200)
      .json({ message: 'Order completed successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const failOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { order_id } = req.params;

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
      ['failed', order_id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res
      .status(200)
      .json({ message: 'Order marked as failed', order: result.rows[0] });
  } catch (error) {
    console.error('Error failing order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const refundOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { order_id } = req.params;

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
      ['refunded', order_id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res
      .status(200)
      .json({ message: 'Order refunded successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Error refunding order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const returnOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { order_id } = req.params;

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
      ['returned', order_id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res
      .status(200)
      .json({ message: 'Order returned successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Error returning order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
