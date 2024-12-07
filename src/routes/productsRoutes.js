"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
const router = express_1.default.Router();
router.get('/', productController_1.getProducts);
router.post('/create', productController_1.createProduct);
router.get('/:product_id', productController_1.getProductById);
router.delete('/delete/:product_id', productController_1.deleteProduct);
router.put('/update/:product_id', productController_1.updateProduct);
exports.default = router;
