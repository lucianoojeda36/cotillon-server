"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const router = express_1.default.Router();
router.post('/create', orderController_1.createOrder);
router.get('/verify/:order_id', orderController_1.verifyOrder);
router.put('/payment', orderController_1.processPayment);
router.put('/ship/:order_id', orderController_1.shipOrder);
router.put('/cancel/:order_id', orderController_1.cancelOrder);
router.put('/complete/:order_id', orderController_1.completeOrder);
router.put('/fail/:order_id', orderController_1.failOrder);
router.put('/refund/:order_id', orderController_1.refundOrder);
router.put('/return/:order_id', orderController_1.returnOrder);
exports.default = router;
