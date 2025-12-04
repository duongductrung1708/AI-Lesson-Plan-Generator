import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto delete after expiresAt
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
OTPSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model<IOTP>('OTP', OTPSchema);

