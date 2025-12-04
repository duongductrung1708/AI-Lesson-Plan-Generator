import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng đăng nhập.',
      });
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      ) as { id: string };

      const authReq = req as AuthRequest;
      authReq.user = await User.findById(decoded.id).select('-password');

      if (!authReq.user) {
        res.status(401).json({
          success: false,
          message: 'Người dùng không tồn tại.',
        });
        return;
      }

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token không hợp lệ.',
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực.',
    });
    return;
  }
};

