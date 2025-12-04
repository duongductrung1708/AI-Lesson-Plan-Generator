import { Response, Request } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';
import Subscription from '../models/Subscription.model';

const PLAN_PRICING: Record<number, number> = {
  1: 99000,
  6: 499000,
  12: 899000,
};

const activateSubscriptionForUser = async (
  userId: string,
  duration: number,
  paymentMethod: string,
  paymentStatus: 'pending' | 'paid' | 'failed'
) => {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + duration);

  let subscription = await Subscription.findOne({ userId });

  if (subscription) {
    subscription.duration = duration as 1 | 6 | 12;
    subscription.status = paymentStatus === 'paid' ? 'active' : 'expired';
    subscription.startDate = new Date();
    subscription.endDate = endDate;
    subscription.paymentMethod = paymentMethod;
    subscription.paymentStatus = paymentStatus;
    await subscription.save();
  } else {
    subscription = await Subscription.create({
      userId,
      duration,
      status: paymentStatus === 'paid' ? 'active' : 'expired',
      startDate: new Date(),
      endDate,
      paymentMethod,
      paymentStatus,
    });
  }

  return subscription;
};

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

    const subscription = await activateSubscriptionForUser(
      authReq.user!._id.toString(),
      duration,
      paymentMethod || 'manual',
      'paid'
    );

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

export const createMomoPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { duration } = req.body as { duration: number };

    if (!duration || ![1, 6, 12].includes(duration)) {
      res.status(400).json({
        success: false,
        message: 'Thời gian không hợp lệ. Chọn 1, 6 hoặc 12 tháng',
      });
      return;
    }

    const amount = PLAN_PRICING[duration];
    if (!amount) {
      res.status(400).json({
        success: false,
        message: 'Không tìm thấy giá cho gói này.',
      });
      return;
    }

    const partnerCode = process.env.MOMO_PARTNER_CODE || '';
    const accessKey = process.env.MOMO_ACCESS_KEY || '';
    const secretKey = process.env.MOMO_SECRET_KEY || '';
    const endpoint =
      process.env.MOMO_ENDPOINT ||
      'https://test-payment.momo.vn/v2/gateway/api/create';

    if (!partnerCode || !accessKey || !secretKey) {
      res.status(500).json({
        success: false,
        message:
          'Thiếu cấu hình MoMo. Vui lòng thiết lập MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY.',
      });
      return;
    }

    const orderId = `${partnerCode}-${Date.now()}`;
    const requestId = orderId;
    const orderInfo = `Thanh toán gói ${duration} tháng cho user ${authReq.user!.email}`;
    const redirectUrl =
      process.env.MOMO_RETURN_URL ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`;
    const ipnUrl =
      process.env.MOMO_IPN_URL ||
      `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/billing/momo-ipn`;
    const extraData = Buffer.from(
      JSON.stringify({
        userId: authReq.user!._id.toString(),
        duration,
      }),
      'utf8'
    ).toString('base64');

    const requestType = 'captureWallet';
    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${partnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const payload = {
      partnerCode,
      requestId,
      amount: amount.toString(),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      lang: 'vi',
      signature,
    };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await resp.json()) as any;

    if (data.resultCode !== 0) {
      res.status(400).json({
        success: false,
        message: data.message || 'Không tạo được phiên thanh toán MoMo',
        data,
      });
      return;
    }

    res.json({
      success: true,
      payUrl: data.payUrl,
      deeplink: data.deeplink,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo thanh toán MoMo',
      error: error.message,
    });
  }
};

export const handleMomoIpn = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;

    const accessKey = process.env.MOMO_ACCESS_KEY || '';
    const secretKey = process.env.MOMO_SECRET_KEY || '';

    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `orderType=${orderType}`,
      `partnerCode=${partnerCode}`,
      `payType=${payType}`,
      `requestId=${requestId}`,
      `responseTime=${responseTime}`,
      `resultCode=${resultCode}`,
      `transId=${transId}`,
      `message=${message}`,
    ].join('&');

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    if (expectedSignature !== signature) {
      res.status(400).json({ resultCode: 1, message: 'Sai chữ ký' });
      return;
    }

    const extra =
      extraData && typeof extraData === 'string'
        ? JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'))
        : null;

    if (resultCode === 0 && extra?.userId && extra?.duration) {
      await activateSubscriptionForUser(
        extra.userId,
        Number(extra.duration),
        'momo',
        'paid'
      );
    }

    res.json({ resultCode: 0, message: 'IPN received' });
  } catch (error: any) {
    res.status(500).json({
      resultCode: 1,
      message: 'Lỗi xử lý IPN',
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

