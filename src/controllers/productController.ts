import { Request, Response } from 'express';
import pool from '../config/database'; // Configuración de PostgreSQL
// import redisClient from '../config/redisClient'; // Cliente Redis

// Obtener productos con caché Redis
export const getProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // console.log('------entro a productos antes del try');
  try {
    // console.log('------entro a productos despues del try');
    // // Verificar si los datos están en el caché
    // const cachedProducts = await redisClient.get('products');

    // if (cachedProducts) {
    //   console.log('Productos obtenidos desde Redis');
    //   res.json(JSON.parse(cachedProducts));
    //   return;
    // }

    // Si no están en el caché, consultar la base de datos
    const result = await pool.query('SELECT * FROM products;');

    // console.log('------result---------', result);

    // Guardar los resultados en Redis (expiración en 1 hora)
    // await redisClient.set('products', JSON.stringify(result.rows), 'EX', 3600);

    console.log('Productos obtenidos desde la base de datos');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener los productos');
  }
};

// Crear producto (actualiza la caché)
export const createProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, price, description, category } = req.body;

    const result = await pool.query(
      'INSERT INTO products (name, price, description, category) VALUES ($1, $2, $3, $4) RETURNING *;',
      [name, price, description, category],
    );

    // Invalida la caché al agregar un producto
    // await redisClient.del('products');

    console.log('Producto creado y caché invalidada');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear producto');
  }
};
export const updateProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { product_id } = req.params;
    const { name, price, description, category } = req.body;

    // Verificar si el producto existe
    const productResult = await pool.query(
      'SELECT * FROM products WHERE product_id = $1;',
      [product_id],
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }

    // Actualizar el producto
    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, description = $3, category = $4 WHERE product_id = $5 RETURNING *;',
      [name, price, description, category, product_id],
    );

    // Invalida la caché al actualizar un producto
    // await redisClient.del('products');

    console.log('Producto actualizado y caché invalidada');
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar producto');
  }
};
export const deleteProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { product_id } = req.params;

    // Verificar si el producto existe
    const productResult = await pool.query(
      'SELECT * FROM products WHERE product_id = $1;',
      [product_id],
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }

    // Eliminar el producto
    await pool.query('DELETE FROM products WHERE product_id = $1;', [
      product_id,
    ]);

    // Invalida la caché al eliminar un producto
    // await redisClient.del('products');

    console.log('Producto eliminado y caché invalidada');
    res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al eliminar producto');
  }
};
export const getProductById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { product_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM products WHERE product_id = $1;',
      [product_id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener producto');
  }
};
