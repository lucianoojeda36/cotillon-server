import express from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/productController';

const router = express.Router();

router.get('/', getProducts);
router.post('/create', createProduct);
router.get('/:product_id', getProductById);
router.delete('/delete/:product_id', deleteProduct);
router.put('/update/:product_id', updateProduct);

export default router;
