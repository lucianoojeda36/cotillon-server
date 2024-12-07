"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductById = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProducts = void 0;
const database_1 = __importDefault(require("../config/database")); // Configuración de PostgreSQL
const redisClient_1 = __importDefault(require("../config/redisClient")); // Cliente Redis
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // // Verificar si los datos están en el caché
        const cachedProducts = yield redisClient_1.default.get('products');
        if (cachedProducts) {
            console.log('Productos obtenidos desde Redis');
            res.json(JSON.parse(cachedProducts));
            return;
        }
        // Si no están en el caché, consultar la base de datos
        const result = yield database_1.default.query('SELECT * FROM products;');
        // Guardar los resultados en Redis (expiración en 1 hora)
        yield redisClient_1.default.set('products', JSON.stringify(result.rows), 'EX', 3600);
        console.log('Productos obtenidos desde la base de datos');
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los productos');
    }
});
exports.getProducts = getProducts;
// Crear producto (actualiza la caché)
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, price, description, category } = req.body;
        const result = yield database_1.default.query('INSERT INTO products (name, price, description, category) VALUES ($1, $2, $3, $4) RETURNING *;', [name, price, description, category]);
        // Invalida la caché al agregar un producto
        yield redisClient_1.default.del('products');
        console.log('Producto creado y caché invalidada');
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error al crear producto');
    }
});
exports.createProduct = createProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { product_id } = req.params;
        const { name, price, description, category } = req.body;
        // Verificar si el producto existe
        const productResult = yield database_1.default.query('SELECT * FROM products WHERE product_id = $1;', [product_id]);
        if (productResult.rows.length === 0) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }
        // Actualizar el producto
        const result = yield database_1.default.query('UPDATE products SET name = $1, price = $2, description = $3, category = $4 WHERE product_id = $5 RETURNING *;', [name, price, description, category, product_id]);
        // Invalida la caché al actualizar un producto
        yield redisClient_1.default.del('products');
        console.log('Producto actualizado y caché invalidada');
        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar producto');
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { product_id } = req.params;
        // Verificar si el producto existe
        const productResult = yield database_1.default.query('SELECT * FROM products WHERE product_id = $1;', [product_id]);
        if (productResult.rows.length === 0) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }
        // Eliminar el producto
        yield database_1.default.query('DELETE FROM products WHERE product_id = $1;', [
            product_id,
        ]);
        // Invalida la caché al eliminar un producto
        yield redisClient_1.default.del('products');
        console.log('Producto eliminado y caché invalidada');
        res.status(200).json({ message: 'Producto eliminado exitosamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar producto');
    }
});
exports.deleteProduct = deleteProduct;
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { product_id } = req.params;
        const result = yield database_1.default.query('SELECT * FROM products WHERE product_id = $1;', [product_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }
        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener producto');
    }
});
exports.getProductById = getProductById;
