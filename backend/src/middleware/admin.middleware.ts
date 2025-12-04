import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  try {
    const user = authReq.user;

    if (!user || !user.isAdmin) {
      res.status(403).json({ message: 'Bạn không có quyền truy cập trang quản trị.' });
      return;
    }

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Lỗi xác thực quyền admin.' });
  }
};


