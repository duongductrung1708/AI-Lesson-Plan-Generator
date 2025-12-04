import { Response, Request } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.model';
import Subscription from '../models/Subscription.model';
import OTP from '../models/OTP.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendActivationEmail, sendOTPEmail } from '../services/email.service';

export const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  
  // @ts-expect-error - expiresIn accepts string values like '7d' which is valid StringValue from ms package
  return jwt.sign(
    { id },
    secret,
    {
      expiresIn,
    }
  );
};

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
      return;
    }

    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng',
      });
      return;
    }

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpires = new Date();
    activationTokenExpires.setHours(activationTokenExpires.getHours() + 24); // 24 hours

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      isActive: false,
      activationToken,
      activationTokenExpires,
    });

    // Send activation email
    try {
      await sendActivationEmail(email, name, activationToken);
    } catch (emailError: any) {
      // If email fails, still create user but log error
      console.error('Failed to send activation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản.',
      });
      return;
    }

    // Check password
    if (!user.password) {
      res.status(401).json({
        success: false,
        message: 'Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google hoặc đặt mật khẩu trong phần Profile để đăng nhập bằng email/mật khẩu.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const activateAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      activationToken: token,
      activationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
      return;
    }

    // Activate user
    user.isActive = true;
    user.activationToken = undefined;
    user.activationTokenExpires = undefined;
    await user.save();

    const jwtToken = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Tài khoản đã được kích hoạt thành công!',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const resendActivationEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email',
      });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này',
      });
      return;
    }

    if (user.isActive) {
      res.status(400).json({
        success: false,
        message: 'Tài khoản đã được kích hoạt',
      });
      return;
    }

    // Generate new activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpires = new Date();
    activationTokenExpires.setHours(activationTokenExpires.getHours() + 24);

    user.activationToken = activationToken;
    user.activationTokenExpires = activationTokenExpires;
    await user.save();

    // Send activation email
    try {
      await sendActivationEmail(email, user.name, activationToken);
      res.json({
        success: true,
        message: 'Email kích hoạt đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.',
      });
    } catch (emailError: any) {
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau.',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const googleCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as any;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
    }

    const token = generateToken(user._id.toString());

    // Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`
    );
  } catch (error: any) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
  }
};

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getMe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    // Lấy kèm password để xác định chính xác hasPassword
    const user = await User.findById(authReq.user?._id).select('+password');
    
    if (!user) {
      res.status(404).json({
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

    // Check subscription status
    const subscription = await Subscription.findOne({ userId: user._id });
    const isSubscriptionActive =
      subscription &&
      subscription.status === 'active' &&
      subscription.paymentStatus === 'paid' &&
      new Date() <= subscription.endDate;

    const remainingTrial = isSubscriptionActive ? 0 : Math.max(0, 3 - user.trialUsageCount);

    res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isActive: user.isActive,
        googleId: user.googleId,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
        hasPassword: !!user.password,
        trialUsageCount: user.trialUsageCount,
        remainingTrial,
        hasActiveSubscription: isSubscriptionActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Tên không được để trống',
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      authReq.user?._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Cập nhật profile thành công',
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isActive: user.isActive,
        googleId: user.googleId,
        createdAt: user.createdAt,
        hasPassword: !!user.password,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin',
      });
      return;
    }

    // Validate new password
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất một chữ cái viết hoa',
      });
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất một chữ cái thường',
      });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất một số',
      });
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất một ký tự đặc biệt',
      });
      return;
    }

    const user = await User.findById(authReq.user?._id).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'Tài khoản này chưa có mật khẩu. Vui lòng sử dụng chức năng "Đặt mật khẩu"',
      });
      return;
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng',
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const setPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu mới',
      });
      return;
    }

    // Validate new password
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất một chữ cái viết hoa',
      });
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất một chữ cái thường',
      });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất một số',
      });
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất một ký tự đặc biệt',
      });
      return;
    }

    const user = await User.findById(authReq.user?._id).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
      return;
    }

    if (user.password) {
      res.status(400).json({
        success: false,
        message: 'Tài khoản này đã có mật khẩu. Vui lòng sử dụng chức năng "Đổi mật khẩu"',
      });
      return;
    }

    // Set password
    user.password = newPassword;
    await user.save();

    // Fetch updated user to return with hasPassword
    const updatedUser = await User.findById(user._id);

    res.json({
      success: true,
      message: 'Đặt mật khẩu thành công',
      user: {
        _id: updatedUser?._id,
        id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        avatar: updatedUser?.avatar,
        isActive: updatedUser?.isActive,
        googleId: updatedUser?.googleId,
        createdAt: updatedUser?.createdAt,
        hasPassword: !!updatedUser?.password,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const sendForgotPasswordOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email',
      });
      return;
    }

    // Check if user exists and get password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      // Don't reveal if user exists or not for security
      res.json({
        success: true,
        message: 'Nếu email tồn tại, mã OTP đã được gửi đến email của bạn.',
      });
      return;
    }

    // Check if user has password (not Google-only account)
    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google hoặc đặt mật khẩu trong phần Profile để có thể đặt lại mật khẩu.',
      });
      return;
    }

    // Check rate limit: 2 minutes (120 seconds)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentOTP = await OTP.findOne({
      email: email.toLowerCase().trim(),
      createdAt: { $gte: twoMinutesAgo },
    }).sort({ createdAt: -1 });

    if (recentOTP) {
      const timeRemaining = Math.ceil(
        (recentOTP.createdAt.getTime() + 2 * 60 * 1000 - Date.now()) / 1000
      );
      res.status(429).json({
        success: false,
        message: `Vui lòng đợi ${timeRemaining} giây trước khi gửi lại mã OTP.`,
        timeRemaining,
      });
      return;
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete old OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase().trim() });

    // Save new OTP
    await OTP.create({
      email: email.toLowerCase().trim(),
      code: otpCode,
      expiresAt,
    });

    // Send OTP email
    try {
      await sendOTPEmail(email.toLowerCase().trim(), user.name, otpCode);
      res.json({
        success: true,
        message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
      });
    } catch (emailError: any) {
      console.error('Failed to send OTP email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email OTP. Vui lòng thử lại sau.',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const verifyOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin',
      });
      return;
    }

    // Find OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim(),
      code: otp,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ hoặc đã hết hạn',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Mã OTP hợp lệ',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

export const verifyOTPAndResetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin',
      });
      return;
    }

    // Validate new password
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất một chữ cái viết hoa',
      });
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất một chữ cái thường',
      });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất một số',
      });
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất một ký tự đặc biệt',
      });
      return;
    }

    // Find OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim(),
      code: otp,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ hoặc đã hết hạn',
      });
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete used OTP
    await OTP.deleteMany({ email: email.toLowerCase().trim() });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};
