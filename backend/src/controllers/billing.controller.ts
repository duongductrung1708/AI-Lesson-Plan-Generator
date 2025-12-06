import { Response, Request } from "express";
import crypto from "crypto";
import { AuthRequest } from "../middleware/auth.middleware";
import Subscription from "../models/Subscription.model";

export const PLAN_PRICING: Record<number, number> = {
  1: 99000,
  6: 499000,
  12: 899000,
};

const activateSubscriptionForUser = async (
  userId: string,
  duration: number,
  paymentMethod: string,
  paymentStatus: "pending" | "paid" | "failed"
) => {
  let subscription = await Subscription.findOne({ userId });
  const now = new Date();

  const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  if (subscription) {
    const isActive =
      subscription.status === "active" &&
      subscription.paymentStatus === "paid" &&
      subscription.endDate > now;

    // If current sub is active, extend from existing endDate; else reset from now
    const newStartDate = isActive ? subscription.startDate || now : now;
    const baseEndDate = isActive ? subscription.endDate : now;

    subscription.duration = duration as 1 | 6 | 12;
    subscription.status = paymentStatus === "paid" ? "active" : "expired";
    subscription.startDate = newStartDate;
    subscription.endDate = addMonths(baseEndDate, duration);
    subscription.paymentMethod = paymentMethod;
    subscription.paymentStatus = paymentStatus;
    await subscription.save();
  } else {
    const endDate = addMonths(now, duration);
    subscription = await Subscription.create({
      userId,
      duration,
      status: paymentStatus === "paid" ? "active" : "expired",
      startDate: now,
      endDate,
      paymentMethod,
      paymentStatus,
    });
  }

  return subscription;
};

export const getPricing = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.json({
      success: true,
      data: PLAN_PRICING,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin giá",
      error: error.message,
    });
  }
};

export const getSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const subscription = await Subscription.findOne({
      userId: authReq.user!._id,
    });

    // If no subscription, return free plan
    if (!subscription) {
      res.json({
        success: true,
        data: {
          _id: null,
          duration: null,
          plan: "free",
          status: "expired",
          startDate: new Date(),
          endDate: new Date(),
          paymentStatus: "pending",
          isActive: false,
        },
      });
      return;
    }

    // Check if subscription is still active
    const isActive =
      subscription.status === "active" &&
      subscription.paymentStatus === "paid" &&
      new Date() <= subscription.endDate;

    // Update status if expired
    if (!isActive && subscription.status === "active") {
      subscription.status = "expired";
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
      message: "Lỗi khi lấy thông tin subscription",
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
        message: "Thời gian không hợp lệ. Chọn 1, 6 hoặc 12 tháng",
      });
      return;
    }

    const subscription = await activateSubscriptionForUser(
      authReq.user!._id.toString(),
      duration,
      paymentMethod || "manual",
      "paid"
    );

    res.json({
      success: true,
      message: "Đăng ký gói thành công",
      data: subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo subscription",
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
        message: "Thời gian không hợp lệ. Chọn 1, 6 hoặc 12 tháng",
      });
      return;
    }

    const amount = PLAN_PRICING[duration];
    if (!amount) {
      res.status(400).json({
        success: false,
        message: "Không tìm thấy giá cho gói này.",
      });
      return;
    }

    const partnerCode = process.env.MOMO_PARTNER_CODE || "";
    const accessKey = process.env.MOMO_ACCESS_KEY || "";
    const secretKey = process.env.MOMO_SECRET_KEY || "";
    const endpoint =
      process.env.MOMO_ENDPOINT ||
      "https://test-payment.momo.vn/v2/gateway/api/create";

    if (!partnerCode || !accessKey || !secretKey) {
      res.status(500).json({
        success: false,
        message:
          "Thiếu cấu hình MoMo. Vui lòng thiết lập MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY.",
      });
      return;
    }

    const orderId = `${partnerCode}-${Date.now()}`;
    const requestId = orderId;
    const orderInfo = `Thanh toán gói ${duration} tháng cho user ${
      authReq.user!.email
    }`;
    const redirectUrl =
      process.env.MOMO_RETURN_URL ||
      `${process.env.FRONTEND_URL || "http://localhost:3000"}/billing`;
    const ipnUrl =
      process.env.MOMO_IPN_URL ||
      `${
        process.env.BACKEND_URL || "http://localhost:5000"
      }/api/billing/momo-ipn`;
    const extraData = Buffer.from(
      JSON.stringify({
        userId: authReq.user!._id.toString(),
        duration,
      }),
      "utf8"
    ).toString("base64");

    // Use payWithMethod to show all payment options (ATM, Credit Card, Wallet)
    // captureWallet only shows QR code for MoMo Wallet
    // payWithATM only shows ATM option
    const requestType = "payWithMethod";
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
    ].join("&");

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

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
      lang: "vi",
      signature,
    };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await resp.json()) as any;

    // Log payment creation for debugging
    console.log("=== MoMo Payment Created ===");
    console.log("Order ID:", orderId);
    console.log("Amount:", amount);
    console.log("Duration:", duration, "months");
    console.log("User:", authReq.user!.email);
    console.log("Result Code:", data.resultCode);
    console.log("Pay URL:", data.payUrl);
    console.log("============================");

    if (data.resultCode !== 0) {
      console.error("❌ Failed to create MoMo payment:", data.message);
      res.status(400).json({
        success: false,
        message: data.message || "Không tạo được phiên thanh toán MoMo",
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
      message: "Lỗi khi tạo thanh toán MoMo",
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

    // Log IPN request for debugging (especially in test mode)
    console.log("=== MoMo IPN Received ===");
    console.log("Order ID:", orderId);
    console.log("Amount:", amount);
    console.log("Result Code:", resultCode);
    console.log("Message:", message);
    console.log("Transaction ID:", transId);
    console.log("Payment Type:", payType);
    console.log("========================");

    const accessKey = process.env.MOMO_ACCESS_KEY || "";
    const secretKey = process.env.MOMO_SECRET_KEY || "";

    // MoMo IPN signature order (per docs):
    // accessKey, amount, extraData, message, orderId, orderInfo, orderType,
    // partnerCode, payType, requestId, responseTime, resultCode, transId
    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `message=${message}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `orderType=${orderType || ""}`,
      `partnerCode=${partnerCode}`,
      `payType=${payType || ""}`,
      `requestId=${requestId}`,
      `responseTime=${responseTime}`,
      `resultCode=${resultCode}`,
      `transId=${transId}`,
    ].join("&");

    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("❌ IPN Signature mismatch!");
      console.error("Expected:", expectedSignature);
      console.error("Received:", signature);
      res.status(400).json({ resultCode: 1, message: "Sai chữ ký" });
      return;
    }

    const extra =
      extraData && typeof extraData === "string"
        ? JSON.parse(Buffer.from(extraData, "base64").toString("utf8"))
        : null;

    console.log("Extra Data:", extra);

    if (resultCode === 0 && extra?.userId && extra?.duration) {
      console.log("✅ Payment successful! Activating subscription...");
      console.log("User ID:", extra.userId);
      console.log("Duration:", extra.duration, "months");

      await activateSubscriptionForUser(
        extra.userId,
        Number(extra.duration),
        "momo",
        "paid"
      );

      console.log("✅ Subscription activated successfully!");
    } else {
      console.log("⚠️ Payment not successful or missing data");
      console.log("Result Code:", resultCode);
      console.log("Extra Data:", extra);
    }

    res.json({ resultCode: 0, message: "IPN received" });
  } catch (error: any) {
    console.error("❌ IPN Error:", error);
    res.status(500).json({
      resultCode: 1,
      message: "Lỗi xử lý IPN",
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
    const subscription = await Subscription.findOne({
      userId: authReq.user!._id,
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy subscription",
      });
      return;
    }

    subscription.status = "cancelled";
    await subscription.save();

    res.json({
      success: true,
      message: "Hủy subscription thành công",
      data: subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy subscription",
      error: error.message,
    });
  }
};
