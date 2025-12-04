# Hướng dẫn Cài đặt Chi tiết

## Yêu cầu hệ thống

- Node.js >= 18.x
- MongoDB >= 5.0 (hoặc MongoDB Atlas account)
- npm >= 9.x hoặc yarn >= 1.22.x

## Cài đặt từng bước

### 1. Clone và cài đặt dependencies

```bash
# Clone repository (nếu chưa có)
git clone <repository-url>
cd AI-Lesson-Plan-Generator

# Cài đặt tất cả dependencies
npm run install-all
```

### 2. Cấu hình MongoDB

#### Option A: MongoDB Local

1. Cài đặt MongoDB trên máy local
2. Khởi động MongoDB service
3. MongoDB sẽ chạy tại `mongodb://localhost:27017`

#### Option B: MongoDB Atlas (Cloud)

1. Tạo tài khoản tại https://www.mongodb.com/cloud/atlas
2. Tạo cluster mới
3. Lấy connection string
4. Thay thế trong file `.env` (bước tiếp theo)

### 3. Cấu hình Backend

1. Tạo file `.env` trong thư mục `backend`:

```bash
cd backend
```

2. Tạo file `.env` với nội dung:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-lesson-plan
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d
NODE_ENV=development
```

**Lưu ý quan trọng:**
- Thay `MONGODB_URI` nếu dùng MongoDB Atlas
- Thay `JWT_SECRET` bằng một chuỗi ngẫu nhiên mạnh (ít nhất 32 ký tự)
- Giữ file `.env` bí mật, không commit lên Git

### 4. Tạo thư mục uploads

```bash
# Từ thư mục backend
mkdir uploads
```

Hoặc thư mục sẽ được tạo tự động khi chạy ứng dụng lần đầu.

### 5. Chạy ứng dụng

#### Cách 1: Chạy cả Backend và Frontend cùng lúc

```bash
# Từ thư mục root
npm run dev
```

#### Cách 2: Chạy riêng biệt

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend sẽ chạy tại: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Frontend sẽ chạy tại: http://localhost:3000

### 6. Kiểm tra ứng dụng

1. Mở trình duyệt tại http://localhost:3000
2. Đăng ký tài khoản mới
3. Đăng nhập
4. Tạo giáo án đầu tiên

## Troubleshooting

### Lỗi kết nối MongoDB

```
MongoServerError: connect ECONNREFUSED
```

**Giải pháp:**
- Kiểm tra MongoDB đã chạy chưa: `mongod --version`
- Kiểm tra connection string trong `.env`
- Nếu dùng MongoDB Atlas, kiểm tra IP whitelist

### Lỗi Port đã được sử dụng

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Giải pháp:**
- Thay đổi PORT trong file `.env`
- Hoặc kill process đang dùng port: 
  - Windows: `netstat -ano | findstr :5000` sau đó `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -ti:5000 | xargs kill`

### Lỗi Module không tìm thấy

```
Cannot find module 'xxx'
```

**Giải pháp:**
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Làm tương tự cho backend và frontend
cd backend && rm -rf node_modules package-lock.json && npm install
cd ../frontend && rm -rf node_modules package-lock.json && npm install
```

### Lỗi TypeScript compilation

**Giải pháp:**
```bash
cd backend
npm run build
```

Kiểm tra lỗi trong output và sửa.

## Cấu trúc Database

Sau khi chạy ứng dụng lần đầu, MongoDB sẽ tự động tạo:

- Database: `ai-lesson-plan` (hoặc tên trong MONGODB_URI)
- Collections:
  - `users` - Thông tin người dùng
  - `lessonplans` - Giáo án đã tạo

## Production Deployment

### Backend

1. Build TypeScript:
```bash
cd backend
npm run build
```

2. Set environment variables trên hosting platform
3. Đảm bảo MongoDB Atlas connection string được cấu hình
4. Deploy

### Frontend

1. Build:
```bash
cd frontend
npm run build
```

2. Deploy thư mục `dist` lên Vercel/Netlify
3. Cấu hình environment variables nếu cần

## Security Checklist

- [ ] Thay đổi JWT_SECRET thành giá trị ngẫu nhiên mạnh
- [ ] Cấu hình CORS đúng domain trong production
- [ ] Sử dụng HTTPS trong production
- [ ] Giới hạn file upload size
- [ ] Validate input ở cả client và server
- [ ] Sử dụng MongoDB Atlas với authentication enabled

## Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs trong console
2. Kiểm tra MongoDB connection
3. Kiểm tra file `.env` đã được tạo đúng chưa
4. Xem README.md để biết thêm thông tin

