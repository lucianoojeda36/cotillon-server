"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const router = (0, express_1.Router)();
router.post('/cart', cartController_1.addOrUpdateCart);
router.get('/cart/:user_id', cartController_1.getUserCart);
router.delete('/cart', cartController_1.removeFromCart);
router.delete('/cart/clear', cartController_1.clearCart);
exports.default = router;
