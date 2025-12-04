import express from 'express';
import {
  createLessonPlan,
  getLessonPlans,
  getLessonPlanById,
  updateLessonPlan,
  deleteLessonPlan,
  downloadLessonPlan,
} from '../controllers/lessonPlan.controller';
import { protect } from '../middleware/auth.middleware';
import { requireActiveSubscription } from '../middleware/subscription.middleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create lesson plan requires active subscription (AI service)
router.post('/', requireActiveSubscription, createLessonPlan);
router.get('/', getLessonPlans);
router.get('/:id', getLessonPlanById);
router.put('/:id', updateLessonPlan);
router.delete('/:id', deleteLessonPlan);
router.get('/:id/download', downloadLessonPlan);

export default router;

