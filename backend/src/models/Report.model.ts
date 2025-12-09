import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  userId?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  title: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReport>('Report', ReportSchema);

