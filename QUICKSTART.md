# Quick Start Guide

## Cài đặt nhanh (5 phút)

### 1. Cài đặt dependencies

```bash
npm run install-all
```

### 2. Cấu hình MongoDB

Đảm bảo MongoDB đang chạy hoặc có MongoDB Atlas connection string.

### 3. Tạo file .env cho Backend

Tạo file `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-lesson-plan
JWT_SECRET=change-this-to-a-random-secret-key-min-32-chars
JWT_EXPIRE=7d
NODE_ENV=development
```

### 4. Chạy ứng dụng

```bash
npm run dev
```

### 5. Truy cập

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Test nhanh

1. Mở http://localhost:3000
2. Click "Đăng ký" → Tạo tài khoản
3. Click "Tạo Giáo Án"
4. Điền form:
   - Tên giáo viên: Nguyễn Văn A
   - Môn học: Ngữ Văn
   - Lớp: 6A
   - Cấp học: THCS
   - Tên bài: Bài 10: Quả Hồng của Thỏ Con
5. Click "Tạo Giáo Án"
6. Xem kết quả và tải xuống DOCX

## Cấu trúc Project

```
├── backend/          # Express.js API
├── frontend/         # React App
├── package.json      # Root scripts
└── README.md         # Tài liệu đầy đủ
```

Xem `SETUP.md` để biết hướng dẫn chi tiết hơn.

