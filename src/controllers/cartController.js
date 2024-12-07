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
exports.clearCart = exports.removeFromCart = exports.getUserCart = exports.addOrUpdateCart = void 0;
const database_1 = __importDefault(require("../config/database"));
const addOrUpdateCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { product_id, user_id, quantity } = req.body;
        // Validar datos
        if (!Number.isInteger(product_id) ||
            !Number.isInteger(user_id) ||
            !Number.isInteger(quantity) ||
            quantity <= 0) {
            res.status(400).json({
                message: 'Datos inválidos: product_id, user_id y quantity deben ser números positivos',
            });
            return;
        }
        // Comenzar transacción
        yield database_1.default.query('BEGIN');
        // Verificar si el producto ya está en el carrito
        const existingCartItem = yield database_1.default.query('SELECT * FROM cart WHERE product_id = $1 AND user_id = $2', [product_id, user_id]);
        let cart;
        if (existingCartItem.rows.length > 0) {
            // Actualizar la cantidad existente
            cart = yield database_1.default.query('UPDATE cart SET quantity = quantity + $1 WHERE product_id = $2 AND user_id = $3 RETURNING *', [quantity, product_id, user_id]);
        }
        else {
            // Insertar nuevo producto
            cart = yield database_1.default.query('INSERT INTO cart (product_id, user_id, quantity) VALUES ($1, $2, $3) RETURNING *', [product_id, user_id, quantity]);
        }
        // Confirmar transacción
        yield database_1.default.query('COMMIT');
        // Responder con éxito
        res.status(existingCartItem.rows.length > 0 ? 200 : 201).json({
            message: existingCartItem.rows.length > 0
                ? 'Cantidad actualizada en el carrito'
                : 'Producto agregado al carrito exitosamente',
            cart: cart.rows[0],
        });
    }
    catch (error) {
        // Revertir transacción en caso de error
        yield database_1.default.query('ROLLBACK');
        if (error instanceof Error) {
            console.error('Mensaje de error:', error.message);
        }
        else {
            console.error('Error desconocido:', error);
        }
        res
            .status(500)
            .json({ message: 'Error interno del servidor al agregar al carrito' });
    }
});
exports.addOrUpdateCart = addOrUpdateCart;
const getUserCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id } = req.params;
        // Validar si user_id está presente
        if (!user_id) {
            res.status(400).json({ message: 'Faltan datos necesarios: user_id' });
            return;
        }
        // Consultar el carrito del usuario
        const userCart = yield database_1.default.query('SELECT * FROM cart WHERE user_id = $1', [
            user_id,
        ]);
        // Validar si el carrito está vacío
        if (userCart.rows.length === 0) {
            res
                .status(404)
                .json({ message: 'El carrito está vacío o el usuario no existe' });
            return;
        }
        // Responder con los datos del carrito
        res.status(200).json({
            message: 'Carrito del usuario obtenido correctamente',
            cart: userCart.rows,
        });
    }
    catch (error) {
        console.error('Error al obtener el carrito del usuario:', error);
        res
            .status(500)
            .json({ message: 'Error interno del servidor al obtener el carrito' });
    }
});
exports.getUserCart = getUserCart;
const removeFromCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, product_id } = req.body;
        // Validar datos de entrada
        if (!Number.isInteger(user_id) || !Number.isInteger(product_id)) {
            res.status(400).json({
                message: 'Datos inválidos: user_id y product_id deben ser números enteros.',
            });
            return;
        }
        // Verificar si el producto existe en el carrito
        const productInCart = yield database_1.default.query('SELECT * FROM cart WHERE user_id = $1 AND product_id = $2', [user_id, product_id]);
        if (productInCart.rows.length === 0) {
            res.status(404).json({ message: 'El producto no está en el carrito.' });
            return;
        }
        // Eliminar el producto del carrito
        yield database_1.default.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [user_id, product_id]);
        // Responder con éxito
        res.status(200).json({
            message: 'Producto eliminado del carrito exitosamente.',
        });
    }
    catch (error) {
        // Manejo de errores
        if (error instanceof Error) {
            console.error('Error al eliminar producto del carrito:', error.message);
        }
        else {
            console.error('Error desconocido:', error);
        }
        res.status(500).json({
            message: 'No se pudo eliminar el producto del carrito debido a un error interno.',
        });
    }
});
exports.removeFromCart = removeFromCart;
const clearCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id } = req.body;
        // Validar que `user_id` es un número entero
        if (!Number.isInteger(user_id)) {
            res.status(400).json({
                message: 'Datos inválidos: user_id debe ser un número entero.',
            });
            return;
        }
        // Verificar si el carrito ya está vacío
        const userCart = yield database_1.default.query('SELECT * FROM cart WHERE user_id = $1', [
            user_id,
        ]);
        if (userCart.rows.length === 0) {
            res
                .status(404)
                .json({ message: 'El carrito ya está vacío o el usuario no existe.' });
            return;
        }
        // Eliminar todos los productos del carrito
        yield database_1.default.query('DELETE FROM cart WHERE user_id = $1', [user_id]);
        // Responder con éxito
        res.status(200).json({
            message: 'Carrito vaciado exitosamente.',
        });
    }
    catch (error) {
        // Manejo de errores
        if (error instanceof Error) {
            console.error('Error al vaciar el carrito:', error.message);
        }
        else {
            console.error('Error desconocido:', error);
        }
        res.status(500).json({
            message: 'No se pudo vaciar el carrito debido a un error interno.',
        });
    }
});
exports.clearCart = clearCart;
