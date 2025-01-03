import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { Request, Response } from 'express';

const secretKey = process.env.SECRET_KEY || 'cotillon';

interface CustomRequest extends Request {
  user?: any;
}

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, rememberMe = false } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        error: 'Todos los campos obligatorios deben ser completados.',
      });
      return;
    }

    const verifyUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    if (verifyUser.rows.length > 0) {
      res
        .status(400)
        .json({ error: 'El correo electrónico ya está registrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, rememberMe) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, rememberMe],
    );

    res.status(201).json({
      message: 'Usuario registrado con éxito.',
      user: newUser.rows[0],
    });
    return;
  } catch (error: any) {
    console.error('Error al registrar el usuario:', error.message);
    res.status(500).json({
      error: 'Ocurrió un error al registrar el usuario. Intente nuevamente.',
    });
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

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, secretKey, { expiresIn: '7d' });

    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [
      refreshToken,
      user.id,
    ]);

    res.json({ ...payload, token, refreshToken });
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
    const { id } = req.user;

    const userResult = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [id],
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const user = userResult.rows[0];

    res.status(200).json(user);
    return;
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
    return;
  }
};
