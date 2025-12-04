# Cấu trúc Dự án

## Tổng quan

Dự án được chia thành 2 phần chính: **Backend** (API Server) và **Frontend** (React App).

## Backend Structure

```
backend/
├── src/
│   ├── server.ts                 # Entry point, khởi tạo Express app
│   ├── models/                   # MongoDB Schemas
│   │   ├── User.model.ts         # Schema cho User
│   │   └── LessonPlan.model.ts   # Schema cho LessonPlan
│   ├── controllers/              # Business logic handlers
│   │   ├── auth.controller.ts    # Xử lý đăng ký/đăng nhập
│   │   └── lessonPlan.controller.ts  # CRUD operations cho giáo án
│   ├── routes/                   # API Routes
│   │   ├── auth.routes.ts        # Routes: /api/auth/*
│   │   ├── lessonPlan.routes.ts  # Routes: /api/lesson-plans/*
│   │   └── upload.routes.ts      # Routes: /api/upload/*
│   ├── middleware/               # Express Middleware
│   │   └── auth.middleware.ts    # JWT authentication middleware
│   └── services/                 # Business services
│       └── ai.service.ts         # AI service (mock/real LLM integration)
├── uploads/                      # Thư mục lưu file upload (tự động tạo)
├── dist/                         # Compiled TypeScript (sau khi build)
├── package.json                  # Backend dependencies
├── tsconfig.json                 # TypeScript config
└── nodemon.json                  # Nodemon config cho development
```

### Backend API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Đăng ký tài khoản mới
- `POST /login` - Đăng nhập
- `GET /me` - Lấy thông tin user hiện tại (protected)

#### Lesson Plans (`/api/lesson-plans`)
- `POST /` - Tạo giáo án mới (protected)
- `GET /` - Lấy danh sách giáo án của user (protected)
- `GET /:id` - Lấy chi tiết giáo án (protected)
- `PUT /:id` - Cập nhật giáo án (protected)
- `DELETE /:id` - Xóa giáo án (protected)
- `GET /:id/download` - Tải xuống DOCX (protected)

#### File Upload (`/api/upload`)
- `POST /` - Upload files (JPG, PNG, PDF) (protected)

## Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx                  # Entry point, render React app
│   ├── App.tsx                   # Main App component với routing
│   ├── index.css                 # Global styles (Tailwind CSS)
│   ├── components/               # Reusable components
│   │   └── Navbar.tsx            # Navigation bar
│   ├── pages/                    # Page components
│   │   ├── Home.tsx              # Trang chủ
│   │   ├── Login.tsx             # Trang đăng nhập
│   │   ├── Register.tsx          # Trang đăng ký
│   │   ├── CreateLessonPlan.tsx  # Form tạo giáo án
│   │   ├── LessonPlanDetail.tsx  # Chi tiết giáo án
│   │   └── MyDocuments.tsx       # Danh sách giáo án đã tạo
│   └── contexts/                 # React Contexts
│       └── AuthContext.tsx       # Authentication context
├── public/                       # Static files
├── dist/                         # Built files (sau khi build)
├── package.json                  # Frontend dependencies
├── vite.config.ts               # Vite configuration
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js           # Tailwind CSS config
└── postcss.config.js            # PostCSS config
```

### Frontend Routes

- `/` - Trang chủ
- `/login` - Đăng nhập
- `/register` - Đăng ký
- `/create` - Tạo giáo án mới (protected)
- `/lesson-plan/:id` - Xem chi tiết giáo án (protected)
- `/my-documents` - Danh sách giáo án của tôi (protected)

## Data Flow

### Tạo Giáo Án

1. User điền form trong `CreateLessonPlan.tsx`
2. Frontend gửi POST request đến `/api/lesson-plans`
3. Backend `lessonPlan.controller.ts` nhận request
4. Controller gọi `ai.service.ts` để tạo nội dung giáo án
5. Lưu vào MongoDB qua `LessonPlan.model.ts`
6. Trả về kết quả cho Frontend
7. Frontend redirect đến trang chi tiết

### Authentication Flow

1. User đăng nhập/đăng ký
2. Backend tạo JWT token
3. Frontend lưu token vào localStorage
4. Mỗi request sau đó gửi kèm token trong header
5. Backend middleware `auth.middleware.ts` verify token
6. Nếu hợp lệ, cho phép truy cập

## Database Schema

### User Collection

```typescript
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  password: string (hashed),
  createdAt: Date
}
```

### LessonPlan Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  teacherName: string,
  subject: string,
  grade: string,
  educationLevel: 'Mầm non' | 'Tiểu học' | 'THCS' | 'THPT',
  duration: number,
  template: '5512' | '2345' | '1001',
  lessonTitle: string,
  uploadedFiles: string[],
  content: {
    objectives: {...},
    equipment: {...},
    activities: {...}
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Key Technologies

### Backend
- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Multer** - File upload handling
- **docx** - Generate Word documents
- **TypeScript** - Type safety

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Markdown** - Render markdown content

## Environment Variables

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-lesson-plan
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
NODE_ENV=development
```

## Build & Deploy

### Backend Build
```bash
cd backend
npm run build
```

### Frontend Build
```bash
cd frontend
npm run build
```

Output sẽ ở `backend/dist` và `frontend/dist`.

