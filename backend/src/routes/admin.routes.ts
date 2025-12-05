import express from 'express';
import User from '../models/User.model';
import Subscription from '../models/Subscription.model';
import LessonPlan from '../models/LessonPlan.model';
import { protect } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { PLAN_PRICING } from '../controllers/billing.controller';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Apply auth + admin guard for all admin routes
router.use(protect, requireAdmin);

// Get basic stats
router.get('/stats', async (_req, res) => {
  try {
    const [userCount, lessonPlanCount, activeSubs, trialUsers] = await Promise.all([
      User.countDocuments(),
      LessonPlan.countDocuments(),
      Subscription.countDocuments({ status: 'active', paymentStatus: 'paid' }),
      User.countDocuments({ trialUsageCount: { $gt: 0 } }),
    ]);

    res.json({
      userCount,
      lessonPlanCount,
      activeSubscriptions: activeSubs,
      trialUsers,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Không lấy được thống kê.' });
  }
});

// ===== User management =====

router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Không lấy được danh sách người dùng.' });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isAdmin } = req.body as { name?: string; isAdmin?: boolean };

    const update: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim().length > 0) {
      update.name = name.trim();
    }
    if (typeof isAdmin === 'boolean') {
      update.isAdmin = isAdmin;
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ message: 'Không có dữ liệu nào để cập nhật.' });
      return;
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-password');

    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Không cập nhật được thông tin người dùng.' });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body as { isActive: boolean };

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Không cập nhật được trạng thái người dùng.' });
  }
});

router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body as { newPassword: string };

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'Mật khẩu mới không hợp lệ.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      id,
      { password: hashed },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng.' });
      return;
    }

    res.json({ message: 'Đặt lại mật khẩu thành công.', user });
  } catch (error) {
    res.status(500).json({ message: 'Không đặt lại được mật khẩu.' });
  }
});

// ===== Subscription management =====

router.get('/subscriptions', async (_req, res) => {
  try {
    const subs = await Subscription.find().populate('userId', 'name email');
    res.json({ subscriptions: subs });
  } catch (error) {
    res.status(500).json({ message: 'Không lấy được danh sách gói.' });
  }
});

// Tạo hoặc cập nhật gói cho user theo email
router.post('/subscriptions', async (req, res) => {
  try {
    const { email, duration, paymentStatus } = req.body as {
      email: string;
      duration: 1 | 6 | 12;
      paymentStatus?: 'pending' | 'paid' | 'failed';
    };

    if (!email || !duration) {
      res.status(400).json({ message: 'Email và thời hạn gói là bắt buộc.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);

    const sub = await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        duration,
        status: 'active',
        startDate,
        endDate,
        paymentStatus: paymentStatus || 'paid',
      },
      { new: true, upsert: true }
    );

    const populated = await sub.populate('userId', 'name email');
    res.status(201).json({ subscription: populated });
  } catch (error) {
    res.status(500).json({ message: 'Không tạo/cập nhật được gói.' });
  }
});

// Cập nhật thông tin gói hiện có
router.patch('/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, status, paymentStatus } = req.body as {
      duration?: 1 | 6 | 12;
      status?: 'active' | 'expired' | 'cancelled';
      paymentStatus?: 'pending' | 'paid' | 'failed';
    };

    const sub = await Subscription.findById(id);
    if (!sub) {
      res.status(404).json({ message: 'Không tìm thấy gói.' });
      return;
    }

    if (duration) {
      sub.duration = duration;
      const start = sub.startDate || new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + duration);
      sub.startDate = start;
      sub.endDate = end;
    }

    if (status) {
      sub.status = status;
    }

    if (paymentStatus) {
      sub.paymentStatus = paymentStatus;
    }

    await sub.save();

    const populated = await sub.populate('userId', 'name email');
    res.json({ subscription: populated });
  } catch (error) {
    res.status(500).json({ message: 'Không cập nhật được gói.' });
  }
});

router.patch('/subscriptions/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await Subscription.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!sub) {
      res.status(404).json({ message: 'Không tìm thấy gói.' });
      return;
    }

    res.json({ subscription: sub });
  } catch (error) {
    res.status(500).json({ message: 'Không hủy được gói.' });
  }
});

router.patch('/subscriptions/:id/extend', async (req, res) => {
  try {
    const { id } = req.params;
    const { months } = req.body as { months: number };

    if (!months || months <= 0) {
      res.status(400).json({ message: 'Số tháng gia hạn không hợp lệ.' });
      return;
    }

    const sub = await Subscription.findById(id);
    if (!sub) {
      res.status(404).json({ message: 'Không tìm thấy gói.' });
      return;
    }

    const currentEnd = sub.endDate || new Date();
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + months);

    sub.endDate = newEnd;
    sub.status = 'active';
    await sub.save();

    res.json({ subscription: sub });
  } catch (error) {
    res.status(500).json({ message: 'Không gia hạn được gói.' });
  }
});

// ===== Lesson plan moderation =====

router.get('/lesson-plans', async (_req, res) => {
  try {
    const plans = await LessonPlan.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    res.json({ lessonPlans: plans });
  } catch (error) {
    res.status(500).json({ message: 'Không lấy được danh sách giáo án.' });
  }
});

router.delete('/lesson-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LessonPlan.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Không tìm thấy giáo án.' });
      return;
    }
    res.json({ message: 'Đã xóa giáo án.' });
  } catch (error) {
    res.status(500).json({ message: 'Không xóa được giáo án.' });
  }
});

// ===== Payment Statistics =====

router.get('/payments/stats', async (_req, res) => {
  try {
    // Get all paid subscriptions
    const paidSubs = await Subscription.find({ paymentStatus: 'paid' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Calculate total revenue
    let totalRevenue = 0;
    const revenueByDuration: Record<number, number> = { 1: 0, 6: 0, 12: 0 };
    const revenueByMonth: Record<string, number> = {};
    const transactionCount = paidSubs.length;
    
    paidSubs.forEach((sub) => {
      if (sub.duration && PLAN_PRICING[sub.duration]) {
        const amount = PLAN_PRICING[sub.duration];
        totalRevenue += amount;
        revenueByDuration[sub.duration] += amount;
        
        // Group by month
        const monthKey = new Date(sub.createdAt).toISOString().slice(0, 7); // YYYY-MM
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + amount;
      }
    });

    // Get failed/pending counts
    const failedCount = await Subscription.countDocuments({ paymentStatus: 'failed' });
    const pendingCount = await Subscription.countDocuments({ paymentStatus: 'pending' });

    // Get recent transactions (last 10)
    const recentTransactions = paidSubs.slice(0, 10).map((sub) => ({
      id: sub._id,
      userEmail: (sub.userId as any)?.email || 'N/A',
      userName: (sub.userId as any)?.name || 'N/A',
      duration: sub.duration,
      amount: sub.duration ? PLAN_PRICING[sub.duration] : 0,
      paymentMethod: sub.paymentMethod || 'N/A',
      createdAt: sub.createdAt,
      status: sub.status,
    }));

    res.json({
      totalRevenue,
      transactionCount,
      failedCount,
      pendingCount,
      revenueByDuration,
      revenueByMonth,
      recentTransactions,
    });
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({ message: 'Không lấy được thống kê thanh toán.' });
  }
});

export default router;


