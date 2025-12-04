import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Subscription from '../models/Subscription.model';

export const getSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const subscription = await Subscription.findOne({ userId: authReq.user!._id });

    // If no subscription, return free plan
    if (!subscription) {
      res.json({
        success: true,
        data: {
          _id: null,
          duration: null,
          plan: 'free',
          status: 'expired',
          startDate: new Date(),
          endDate: new Date(),
          paymentStatus: 'pending',
          isActive: false,
        },
      });
      return;
    }

    // Check if subscription is still active
    const isActive =
      subscription.status === 'active' &&
      subscription.paymentStatus === 'paid' &&
      new Date() <= subscription.endDate;

    // Update status if expired
    if (!isActive && subscription.status === 'active') {
      subscription.status = 'expired';
      await subscription.save();
    }

    // Convert plan to duration for backward compatibility
    let duration = subscription.duration;
    if (!duration && subscription.plan) {
      // Convert old plan to duration (default to 1 month)
      duration = 1;
    }

    res.json({
      success: true,
      data: {
        ...subscription.toObject(),
        duration: duration || null,
        isActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin subscription',
      error: error.message,
    });
  }
};

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { duration, paymentMethod } = req.body;

    if (!duration || ![1, 6, 12].includes(duration)) {
      res.status(400).json({
        success: false,
        message: 'Thời gian không hợp lệ. Chọn 1, 6 hoặc 12 tháng',
      });
      return;
    }

    // Calculate end date based on duration
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration);

    // Check if user already has a subscription
    let subscription = await Subscription.findOne({ userId: authReq.user!._id });

    if (subscription) {
      // Update existing subscription
      subscription.duration = duration;
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.endDate = endDate;
      subscription.paymentMethod = paymentMethod || 'manual';
      subscription.paymentStatus = 'paid';
      await subscription.save();
    } else {
      // Create new subscription
      subscription = await Subscription.create({
        userId: authReq.user!._id,
        duration,
        status: 'active',
        startDate: new Date(),
        endDate,
        paymentMethod: paymentMethod || 'manual',
        paymentStatus: 'paid',
      });
    }

    res.json({
      success: true,
      message: 'Đăng ký gói thành công',
      data: subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo subscription',
      error: error.message,
    });
  }
};

export const cancelSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const subscription = await Subscription.findOne({ userId: authReq.user!._id });

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy subscription',
      });
      return;
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.json({
      success: true,
      message: 'Hủy subscription thành công',
      data: subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy subscription',
      error: error.message,
    });
  }
};

