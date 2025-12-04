import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  isAdmin: boolean;
  isActive: boolean;
  activationToken?: string;
  activationTokenExpires?: Date;
  trialUsageCount: number; // Số lần đã dùng thử trong tháng hiện tại
  trialMonth: string; // Tháng hiện tại (format: YYYY-MM)
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
  },
  password: {
    type: String,
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false,
  },
  googleId: {
    type: String,
    sparse: true,
  },
  avatar: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  activationToken: {
    type: String,
  },
  activationTokenExpires: {
    type: Date,
  },
  trialUsageCount: {
    type: Number,
    default: 0,
  },
  trialMonth: {
    type: String,
    default: () => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving (only if password exists and is modified)
UserSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password as string);
};

export default mongoose.model<IUser>('User', UserSchema);

