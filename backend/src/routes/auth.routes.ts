import express from 'express';
import passport from 'passport';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  activateAccount,
  resendActivationEmail,
  googleCallback,
  updateProfile,
  changePassword,
  setPassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Tên không được để trống'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/[A-Z]/, 'Mật khẩu phải có ít nhất một chữ cái viết hoa')
    .matches(/[a-z]/, 'Mật khẩu phải có ít nhất một chữ cái thường')
    .matches(/[0-9]/, 'Mật khẩu phải có ít nhất một số')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Mật khẩu phải có ít nhất một ký tự đặc biệt'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/set-password', protect, setPassword);

// Account activation
router.get('/activate/:token', activateAccount);
router.post('/resend-activation', resendActivationEmail);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  googleCallback
);

export default router;

