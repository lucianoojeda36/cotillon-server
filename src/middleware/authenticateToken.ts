import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = process.env.SECRET_KEY || 'cotillon';

interface CustomRequest extends Request {
  user?: any; // Cambia `any` por el tipo que necesites
}

export const authenticateToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): void => {
  // Obtener el token del encabezado 'Authorization'
  const token = req.headers['authorization']?.split(' ')[1];

  // Verificar si el token está presente
  if (!token) {
    res.status(401).json({ message: 'Token requerido' });
    return;
  }

  // Verificar el token usando jwt.verify
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      res.status(403).json({ message: 'Token inválido' });
      return;
    }

    // Si el token es válido, asignar el usuario a la solicitud (req)
    req.user = user;

    // Llamar al siguiente middleware o controlador
    next();
  });
};
