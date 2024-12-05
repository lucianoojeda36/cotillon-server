import express from 'express';
import {
  getProfile,
  loginUser,
  refreshAccessToken,
  registerUser,
} from '../controllers/userContoller';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

router.post('/registerUser', registerUser);
router.get('/loginUser', loginUser);
router.post('/refreshToken', refreshAccessToken);
router.get('/profile', authenticateToken, getProfile);

export default router;
