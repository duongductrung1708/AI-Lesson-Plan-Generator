import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import Subscription from '../models/Subscription.model';
import User from '../models/User.model';

const MAX_TRIAL_USAGE = 3; // Tối đa 3 lần dùng thử mỗi tháng

/**
 * Get current month string (YYYY-MM)
 */
const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Check if user can use trial (has subscription or has trial usage left)
 */
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập',
      });
      return;
    }

    // Check subscription first
    const subscription = await Subscription.findOne({ userId: authReq.user._id });
    const isSubscriptionActive =
      subscription &&
      subscription.status === 'active' &&
      subscription.paymentStatus === 'paid' &&
      new Date() <= subscription.endDate;

    // If has active subscription, allow
    if (isSubscriptionActive) {
      return next();
    }

    // Check trial usage
    const user = await User.findById(authReq.user._id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
      return;
    }

    const currentMonth = getCurrentMonth();
    
    // Reset counter if new month
    if (user.trialMonth !== currentMonth) {
      user.trialUsageCount = 0;
      user.trialMonth = currentMonth;
      await user.save();
    }

    // Check if trial usage is available
    if (user.trialUsageCount >= MAX_TRIAL_USAGE) {
      res.status(403).json({
        success: false,
        message: `Bạn đã sử dụng hết ${MAX_TRIAL_USAGE} lần dùng thử trong tháng này. Vui lòng đăng ký gói để tiếp tục sử dụng.`,
      });
      return;
    }

    // Allow trial usage
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra subscription',
      error: error.message,
    });
  }
};

