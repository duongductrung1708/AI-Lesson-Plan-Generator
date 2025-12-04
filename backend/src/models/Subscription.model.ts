import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  duration?: 1 | 6 | 12; // months: 1, 6, or 12
  plan?: string; // For backward compatibility (deprecated)
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    duration: {
      type: Number,
      enum: [1, 6, 12], // 1 month, 6 months, 12 months
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'], // For backward compatibility (deprecated)
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'expired',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
// Note: userId already has unique index from unique: true
SubscriptionSchema.index({ status: 1, endDate: 1 });

// Method to check if subscription is active
SubscriptionSchema.methods.isActive = function (): boolean {
  return (
    this.status === 'active' &&
    this.paymentStatus === 'paid' &&
    new Date() <= this.endDate
  );
};

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

