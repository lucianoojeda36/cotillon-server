"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userContoller_1 = require("../controllers/userContoller");
const authenticateToken_1 = require("../middleware/authenticateToken");
const router = express_1.default.Router();
router.post('/registerUser', userContoller_1.registerUser);
router.get('/loginUser', userContoller_1.loginUser);
router.post('/refreshToken', userContoller_1.refreshAccessToken);
router.get('/profile', authenticateToken_1.authenticateToken, userContoller_1.getProfile);
exports.default = router;
