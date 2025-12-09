import express from 'express';
import Report from '../models/Report.model';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Create a report (optionally authenticated)
router.post('/', protect, async (req: any, res) => {
  try {
    const { title, message } = req.body as { title?: string; message?: string };
    const name = req.body.name || req.user?.name;
    const email = req.body.email || req.user?.email;

    if (!title || !message) {
      res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc.' });
      return;
    }

    const report = await Report.create({
      userId: req.user?._id,
      name,
      email,
      title: title.trim(),
      message: message.trim(),
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Không gửi được báo cáo.' });
  }
});

// Public endpoint for unauthenticated users
router.post('/public', async (req, res) => {
  try {
    const { title, message, name, email } = req.body as {
      title?: string;
      message?: string;
      name?: string;
      email?: string;
    };

    if (!title || !message) {
      res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc.' });
      return;
    }

    const report = await Report.create({
      name,
      email,
      title: title.trim(),
      message: message.trim(),
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error('Create public report error:', error);
    res.status(500).json({ message: 'Không gửi được báo cáo.' });
  }
});

export default router;

