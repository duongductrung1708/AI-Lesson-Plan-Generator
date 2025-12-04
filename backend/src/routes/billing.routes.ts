import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getSubscription,
  createSubscription,
  cancelSubscription,
} from '../controllers/billing.controller';

const router = express.Router();

// All routes require authentication
router.get('/', protect, getSubscription);
router.post('/', protect, createSubscription);
router.put('/cancel', protect, cancelSubscription);

export default router;

