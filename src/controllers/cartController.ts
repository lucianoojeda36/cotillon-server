import { Request, Response } from 'express';
import pool from '../config/database';

export const addOrUpdateCart = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { product_id, user_id, quantity } = req.body;

    if (
      !Number.isInteger(product_id) ||
      !Number.isInteger(user_id) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      res.status(400).json({
        message:
          'Datos inválidos: product_id, user_id y quantity deben ser números positivos',
      });
      return;
    }

    await pool.query('BEGIN');

    const existingCartItem = await pool.query(
      'SELECT * FROM cart WHERE product_id = $1 AND user_id = $2',
      [product_id, user_id],
    );

    let cart;
    if (existingCartItem.rows.length > 0) {
      cart = await pool.query(
        'UPDATE cart SET quantity = quantity + $1 WHERE product_id = $2 AND user_id = $3 RETURNING *',
        [quantity, product_id, user_id],
      );
    } else {
      cart = await pool.query(
        'INSERT INTO cart (product_id, user_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [product_id, user_id, quantity],
      );
    }

    await pool.query('COMMIT');

    res.status(existingCartItem.rows.length > 0 ? 200 : 201).json({
      message:
        existingCartItem.rows.length > 0
          ? 'Cantidad actualizada en el carrito'
          : 'Producto agregado al carrito exitosamente',
      cart: cart.rows[0],
    });
  } catch (error) {
    await pool.query('ROLLBACK');

    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
    } else {
      console.error('Error desconocido:', error);
    }
    res
      .status(500)
      .json({ message: 'Error interno del servidor al agregar al carrito' });
  }
};

export const getUserCart = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ message: 'Faltan datos necesarios: user_id' });
      return;
    }

    const userCart = await pool.query('SELECT * FROM cart WHERE user_id = $1', [
      user_id,
    ]);

    if (userCart.rows.length === 0) {
      res
        .status(404)
        .json({ message: 'El carrito está vacío o el usuario no existe' });
      return;
    }

    res.status(200).json({
      message: 'Carrito del usuario obtenido correctamente',
      cart: userCart.rows,
    });
  } catch (error) {
    console.error('Error al obtener el carrito del usuario:', error);
    res
      .status(500)
      .json({ message: 'Error interno del servidor al obtener el carrito' });
  }
};

export const removeFromCart = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user_id, product_id } = req.body;

    if (!Number.isInteger(user_id) || !Number.isInteger(product_id)) {
      res.status(400).json({
        message:
          'Datos inválidos: user_id y product_id deben ser números enteros.',
      });
      return;
    }

    const productInCart = await pool.query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id],
    );

    if (productInCart.rows.length === 0) {
      res.status(404).json({ message: 'El producto no está en el carrito.' });
      return;
    }

    await pool.query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id],
    );

    res.status(200).json({
      message: 'Producto eliminado del carrito exitosamente.',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error al eliminar producto del carrito:', error.message);
    } else {
      console.error('Error desconocido:', error);
    }
    res.status(500).json({
      message:
        'No se pudo eliminar el producto del carrito debido a un error interno.',
    });
  }
};
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id } = req.body;

    if (!Number.isInteger(user_id)) {
      res.status(400).json({
        message: 'Datos inválidos: user_id debe ser un número entero.',
      });
      return;
    }

    const userCart = await pool.query('SELECT * FROM cart WHERE user_id = $1', [
      user_id,
    ]);

    if (userCart.rows.length === 0) {
      res
        .status(404)
        .json({ message: 'El carrito ya está vacío o el usuario no existe.' });
      return;
    }

    await pool.query('DELETE FROM cart WHERE user_id = $1', [user_id]);

    res.status(200).json({
      message: 'Carrito vaciado exitosamente.',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error al vaciar el carrito:', error.message);
    } else {
      console.error('Error desconocido:', error);
    }
    res.status(500).json({
      message: 'No se pudo vaciar el carrito debido a un error interno.',
    });
  }
};
