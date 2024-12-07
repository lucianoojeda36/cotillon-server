"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { CACHE_HOST, CACHE_PORT } = process.env;
if (!CACHE_HOST || !CACHE_PORT) {
    throw new Error('CACHE_HOST y CACHE_PORT deben estar definidas en el archivo .env');
}
const port = parseInt(CACHE_PORT, 10);
const redisClient = new ioredis_1.default({
    host: CACHE_HOST,
    port: port,
});
redisClient.on('connect', () => {
    console.log('Conectado a Redis');
});
redisClient.on('error', (err) => {
    console.error('Error en Redis:', err);
});
exports.default = redisClient;
