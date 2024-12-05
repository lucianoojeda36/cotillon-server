import express from 'express';
import {
  createOrder,
  verifyOrder,
  processPayment,
  shipOrder,
  cancelOrder,
  completeOrder,
  failOrder,
  refundOrder,
  returnOrder,
} from '../controllers/orderController';

const router = express.Router();

router.post('/create', createOrder);
router.get('/verify/:order_id', verifyOrder);
router.put('/payment', processPayment);
router.put('/ship/:order_id', shipOrder);
router.put('/cancel/:order_id', cancelOrder);
router.put('/complete/:order_id', completeOrder);
router.put('/fail/:order_id', failOrder);
router.put('/refund/:order_id', refundOrder);
router.put('/return/:order_id', returnOrder);

export default router;
