import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { Request, Response } from 'express';

const secretKey = process.env.SECRET_KEY || 'cotillon';

interface CustomRequest extends Request {
  user?: any; // Cambia `any` por el tipo que necesites
}

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword],
    );

    res
      .status(201)
      .json({ message: 'Usuario registrado', user: newUser.rows[0] });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send('Error to register user');
    return;
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Contraseña incorrecta' });
      return;
    }

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, secretKey, { expiresIn: '7d' });

    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [
      refreshToken,
      user.id,
    ]);

    res.json({ token, refreshToken });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).send('error to login user');
    return;
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE refresh_token = $1',
      [refreshToken],
    );
    const user = userResult.rows[0];

    if (!user) {
      res.status(403).json({ message: 'Refresh token inválido' });
      return;
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email },
      secretKey,
      { expiresIn: '1h' },
    );
    res.json({ token: newAccessToken });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).send('error en el refreshtoken');
    return;
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE refresh_token = $1',
      [refreshToken],
    );
    return res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.log(error);
    return res.status(500).send('error al salir del usuario');
  }
};

export const getProfile = async (
  req: CustomRequest,
  res: Response,
): Promise<void> => {
  try {
    // Se recomienda usar un ID único o extraer información desde el JWT
    const { id } = req.user; // Asumiendo que `req.user` contiene los datos del token JWT

    // Consulta basada en ID único
    const userResult = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [id],
    );

    // Verificar si el usuario existe
    if (userResult.rows.length === 0) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Obtener los datos del usuario
    const user = userResult.rows[0];

    // Enviar respuesta con los datos del usuario
    res.status(200).json(user); // Aquí sí retornamos la respuesta al cliente
    return;
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
    return;
  }
};
