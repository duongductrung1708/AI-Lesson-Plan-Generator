import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonPlan extends Document {
  userId: mongoose.Types.ObjectId;
  teacherName: string;
  subject: string;
  grade: string;
  educationLevel: 'Mầm non' | 'Tiểu học' | 'THCS' | 'THPT';
  duration: number;
  template: '5512' | '2345' | '1001';
  lessonTitle: string;
  uploadedFiles?: string[];
  content: {
    objectives: {
      knowledge: string;
      competencies: {
        general: string[];
        specific: string[];
      };
      qualities: string[];
    };
    equipment: {
      teacher: string[];
      student: string[];
    };
    activities: {
      activity1: { title: string; content: string };
      activity2: { title: string; content: string };
      activity3: { title: string; content: string };
      activity4: { title: string; content: string };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const LessonPlanSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    educationLevel: {
      type: String,
      enum: ['Mầm non', 'Tiểu học', 'THCS', 'THPT'],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    template: {
      type: String,
      enum: ['5512', '2345', '1001'],
      required: true,
    },
    lessonTitle: {
      type: String,
      required: true,
    },
    uploadedFiles: {
      type: [String],
      default: [],
    },
    content: {
      objectives: {
        knowledge: String,
        competencies: {
          general: [String],
          specific: [String],
        },
        qualities: [String],
      },
      equipment: {
        teacher: [String],
        student: [String],
      },
      activities: {
        activity1: { title: String, content: String },
        activity2: { title: String, content: String },
        activity3: { title: String, content: String },
        activity4: { title: String, content: String },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
LessonPlanSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ILessonPlan>('LessonPlan', LessonPlanSchema);

