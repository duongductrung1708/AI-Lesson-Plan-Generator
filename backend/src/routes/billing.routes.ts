import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getPricing,
  getSubscription,
  createSubscription,
  cancelSubscription,
  createMomoPayment,
  handleMomoIpn,
} from '../controllers/billing.controller';

const router = express.Router();

// Pricing endpoint - public (no auth required)
router.get('/pricing', getPricing);

// All routes require authentication
router.get('/', protect, getSubscription);
router.post('/', protect, createSubscription);
router.put('/cancel', protect, cancelSubscription);
router.post('/momo', protect, createMomoPayment);
router.post('/momo-ipn', handleMomoIpn);

export default router;

