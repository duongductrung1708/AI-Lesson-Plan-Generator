# AI Lesson Plan Generator

Ứng dụng web hỗ trợ giáo viên soạn giáo án tự động theo Công văn 2345/BGDĐT-GDTrH của Bộ Giáo dục và Đào tạo Việt Nam.

## Công nghệ sử dụng

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Document Generation**: docx library

## Tính năng chính

- ✅ Đăng ký/Đăng nhập người dùng
- ✅ Tạo giáo án tự động theo Công văn 2345
- ✅ Upload tài liệu (hình ảnh, PDF) để làm ngữ cảnh
- ✅ Hiển thị giáo án chi tiết với định dạng Markdown
- ✅ Tải xuống giáo án dưới dạng DOCX
- ✅ Lưu trữ và quản lý lịch sử giáo án (My Documents)
- ✅ Giao diện responsive, thân thiện với người dùng

## Cấu trúc giáo án (Công văn 2345)

Giáo án được tạo tự động bao gồm:

1. **Mục tiêu bài học**
   - Kiến thức
   - Năng lực (chung và đặc thù)
   - Phẩm chất

2. **Thiết bị dạy học và học liệu**
   - Cho giáo viên
   - Cho học sinh

3. **Tiến trình dạy học**
   - Hoạt động 1: Mở đầu
   - Hoạt động 2: Hình thành kiến thức mới
   - Hoạt động 3: Luyện tập
   - Hoạt động 4: Vận dụng/Tìm tòi mở rộng

## Cài đặt và chạy

### Yêu cầu

- Node.js >= 18
- MongoDB (local hoặc MongoDB Atlas)
- npm hoặc yarn

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd AI-Lesson-Plan-Generator
```

### Bước 2: Cài đặt dependencies

```bash
# Cài đặt tất cả dependencies (root, backend, frontend)
npm run install-all

# Hoặc cài đặt từng phần:
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Bước 3: Cấu hình Backend

1. Tạo file `.env` trong thư mục `backend`:

```bash
cd backend
cp .env.example .env
```

2. Chỉnh sửa file `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-lesson-plan
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Lưu ý**: Thay đổi `MONGODB_URI` nếu bạn sử dụng MongoDB Atlas hoặc MongoDB ở địa chỉ khác.

### Bước 4: Chạy ứng dụng

#### Chạy cả Backend và Frontend cùng lúc:

```bash
npm run dev
```

#### Hoặc chạy riêng biệt:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Bước 5: Truy cập ứng dụng

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

## API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin người dùng hiện tại (cần JWT)

### Lesson Plans

- `POST /api/lesson-plans` - Tạo giáo án mới (cần JWT)
- `GET /api/lesson-plans` - Lấy danh sách giáo án của người dùng (cần JWT)
- `GET /api/lesson-plans/:id` - Lấy chi tiết giáo án (cần JWT)
- `PUT /api/lesson-plans/:id` - Cập nhật giáo án (cần JWT)
- `DELETE /api/lesson-plans/:id` - Xóa giáo án (cần JWT)
- `GET /api/lesson-plans/:id/download` - Tải xuống giáo án dạng DOCX (cần JWT)

### File Upload

- `POST /api/upload` - Upload file (JPG, PNG, PDF) (cần JWT)

## Cấu trúc thư mục

```
AI-Lesson-Plan-Generator/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Controllers xử lý logic
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Middleware (auth, etc.)
│   │   ├── services/        # Business logic (AI service)
│   │   └── server.ts        # Entry point
│   ├── uploads/             # Thư mục lưu file upload
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth)
│   │   └── App.tsx         # Main App component
│   └── package.json
└── package.json            # Root package.json
```

## AI Service

Hiện tại, ứng dụng sử dụng **mock AI service** để tạo giáo án. Trong file `backend/src/services/ai.service.ts`, bạn có thể tích hợp với các LLM thật như:

- OpenAI GPT-4
- Claude (Anthropic)
- Google Gemini
- Hoặc các mô hình AI khác

Để tích hợp, chỉ cần thay thế logic trong hàm `generateLessonPlan()` bằng API calls thật.

## Testing

Để test ứng dụng:

1. Đăng ký tài khoản mới
2. Đăng nhập
3. Tạo giáo án mới với thông tin:
   - Tên giáo viên
   - Môn học
   - Lớp
   - Cấp học
   - Tên bài giảng
4. Xem kết quả và tải xuống file DOCX
5. Xem lịch sử trong "Tài Liệu Của Tôi"

## Deployment

### Backend (Heroku/Railway/Render)

1. Build TypeScript:
```bash
cd backend
npm run build
```

2. Set environment variables trên hosting platform
3. Deploy

### Frontend (Vercel/Netlify)

1. Build:
```bash
cd frontend
npm run build
```

2. Deploy thư mục `dist`

## Lưu ý

- Đảm bảo MongoDB đang chạy trước khi start backend
- Thay đổi `JWT_SECRET` trong production
- Cấu hình CORS nếu frontend và backend ở domain khác nhau
- File upload được giới hạn 10MB mỗi file

## License

MIT

## Tác giả

Phát triển bởi AI Lesson Plan Generator Team

