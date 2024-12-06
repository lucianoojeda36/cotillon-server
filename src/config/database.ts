import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = process.env;

if (!DB_USER || !DB_HOST || !DB_NAME || !DB_PASSWORD || !DB_PORT) {
  throw new Error(
    'Faltan variables de entorno para configurar la base de datos',
  );
}

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: Number(DB_PORT),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('Conectado a database');
});

pool.on('error', (err) => {
  console.error('Error en pool:', err);
});

pool.query('SELECT 1', (err) => {
  if (err) {
    console.error('Error al verificar conexión inicial:', err);
    process.exit(1);
  }
});

export default pool;
