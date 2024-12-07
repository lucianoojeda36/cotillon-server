import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const { CACHE_HOST, CACHE_PORT } = process.env;

if (!CACHE_HOST || !CACHE_PORT) {
  throw new Error(
    'CACHE_HOST y CACHE_PORT deben estar definidas en el archivo .env',
  );
}

const port = parseInt(CACHE_PORT, 10);

const redisClient = new Redis({
  host: CACHE_HOST,
  port: port,
});

redisClient.on('connect', () => {
  console.log('Conectado a Redis');
});

redisClient.on('error', (err) => {
  console.error('Error en Redis:', err);
});

export default redisClient;
