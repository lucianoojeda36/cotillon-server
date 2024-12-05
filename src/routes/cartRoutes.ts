import { Router } from 'express';
import {
  addOrUpdateCart,
  getUserCart,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';

const router = Router();

router.post('/cart', addOrUpdateCart);
router.get('/cart/:user_id', getUserCart);
router.delete('/cart', removeFromCart);
router.delete('/cart/clear', clearCart);

export default router;
