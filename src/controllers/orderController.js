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
exports.returnOrder = exports.refundOrder = exports.failOrder = exports.completeOrder = exports.cancelOrder = exports.shipOrder = exports.processPayment = exports.verifyOrder = exports.createOrder = void 0;
const database_1 = __importDefault(require("../config/database"));
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, total } = req.body;
        // Verificar que los parámetros necesarios estén presentes
        if (!user_id || !total) {
            res
                .status(400)
                .json({ message: 'User ID and total amount are required' });
            return;
        }
        const status = 'pending'; // Estado inicial de la orden
        const result = yield database_1.default.query('INSERT INTO orders (user_id, status, total) VALUES ($1, $2, $3) RETURNING *', [user_id, status, total]);
        // La orden se creó con éxito, respondemos con la orden creada
        const createdOrder = result.rows[0];
        res.status(201).json({
            message: 'Order created successfully',
            order: createdOrder,
        });
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createOrder = createOrder;
const verifyOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        const result = yield database_1.default.query('SELECT * FROM orders WHERE order_id = $1', [order_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        // Verificar alguna condición (como disponibilidad de productos o validez del pago)
        const order = result.rows[0];
        if (order.status !== 'pending') {
            res.status(400).json({ message: 'Order already processed' });
            return;
        }
        // Si todo está bien
        res.status(200).json({ message: 'Order is valid for processing', order });
    }
    catch (error) {
        console.error('Error verifying order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.verifyOrder = verifyOrder;
const processPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id, payment_details } = req.body;
        // Lógica para procesar el pago (puede ser integración con un sistema de pagos)
        // Aquí asumimos que el pago es exitoso
        const result = yield database_1.default.query('UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *', ['paid', order_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        res.status(200).json({
            message: 'Payment processed successfully',
            order: result.rows[0],
        });
    }
    catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.processPayment = processPayment;
const shipOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        const result = yield database_1.default.query('UPDATE orders SET status = $1, shipped_at = NOW() WHERE order_id = $2 RETURNING *', ['shipped', order_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        res
            .status(200)
            .json({ message: 'Order shipped successfully', order: result.rows[0] });
    }
    catch (error) {
        console.error('Error shipping order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.shipOrder = shipOrder;
const cancelOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        const result = yield database_1.default.query('UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *', ['cancelled', order_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        res
            .status(200)
            .json({ message: 'Order cancelled successfully', order: result.rows[0] });
    }
    catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.cancelOrder = cancelOrder;
const completeOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        const result = yield database_1.default.query('UPDATE orders SET status = $1, completed_at = NOW() WHERE order_id = $2 RETURNING *', ['completed', order_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        res
            .status(200)
            .json({ message: 'Order completed successfully', order: result.rows[0] });
    }
    catch (error) {
        console.error('Error completing order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.completeOrder = completeOrder;
const failOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        const result = yield database_1.default.query('UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *', ['failed', order_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        res
            .status(200)
            .json({ message: 'Order marked as failed', order: result.rows[0] });
    }
    catch (error) {
        console.error('Error failing order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.failOrder = failOrder;
const refundOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        // Aquí se asume que el reembolso fue exitoso (puedes integrar un sistema de pagos para verificar el estado real)
        const result = yield database_1.default.query('UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *', ['refunded', order_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        res
            .status(200)
            .json({ message: 'Order refunded successfully', order: result.rows[0] });
    }
    catch (error) {
        console.error('Error refunding order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.refundOrder = refundOrder;
const returnOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        const result = yield database_1.default.query('UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *', ['returned', order_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        res
            .status(200)
            .json({ message: 'Order returned successfully', order: result.rows[0] });
    }
    catch (error) {
        console.error('Error returning order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.returnOrder = returnOrder;
