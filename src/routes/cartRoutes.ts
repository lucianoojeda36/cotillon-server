import { Router } from 'express';
import {
  addOrUpdateCart,
  getUserCart,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';

const router = Router();

router.post('/', addOrUpdateCart);
router.get('/:user_id', getUserCart);
router.delete('/delete', removeFromCart);
router.delete('/clear', clearCart);

export default router;
