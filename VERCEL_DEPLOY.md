# Hướng dẫn Deploy lên Vercel

## Vấn đề
Vercel chủ yếu dành cho frontend static sites. Backend Express.js cần deploy trên platform khác (Render, Railway, Heroku, etc.).

## Giải pháp: Deploy Frontend trên Vercel + Backend trên Render

### Bước 1: Deploy Backend lên Render

1. Đăng nhập vào [Render](https://render.com)
2. Tạo Web Service mới từ GitHub repo
3. Cấu hình:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Thêm tất cả biến từ `backend/.env`

4. Lấy URL backend (ví dụ: `https://your-app.onrender.com`)

### Bước 2: Deploy Frontend lên Vercel

1. Đăng nhập vào [Vercel](https://vercel.com)
2. Import project từ GitHub
3. Cấu hình:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Thêm Environment Variable**:
   ```
   VITE_API_URL=https://your-app.onrender.com
   ```
   (Thay `https://your-app.onrender.com` bằng URL backend của bạn)

5. **File `vercel.json` đã được tạo sẵn** trong thư mục `frontend` để xử lý SPA routing (tránh lỗi 404 khi refresh)

6. Deploy

### Bước 3: Cấu hình CORS trên Backend

Đảm bảo trong `backend/.env` có:
```env
FRONTEND_URL=https://your-frontend.vercel.app
```

### Bước 4: Cấu hình MoMo IPN URL

Trong `backend/.env`:
```env
MOMO_IPN_URL=https://your-app.onrender.com/api/billing/momo-ipn
```

## Kiểm tra

1. Truy cập frontend trên Vercel
2. Thử đăng nhập/đăng ký
3. Kiểm tra Network tab trong DevTools để xem API calls có đúng URL không

## Troubleshooting

### Lỗi: "Network Error" hoặc "CORS Error"
- Kiểm tra `FRONTEND_URL` trong backend `.env` đã đúng chưa
- Kiểm tra `VITE_API_URL` trong Vercel environment variables

### Lỗi: "Cannot GET /api/..."
- Kiểm tra `VITE_API_URL` đã được set trong Vercel chưa
- Rebuild và redeploy frontend sau khi thêm environment variable

### API calls vẫn đi đến localhost
- Xóa cache trình duyệt
- Kiểm tra lại `VITE_API_URL` trong Vercel dashboard
- Rebuild frontend

### Lỗi 404 khi refresh trang
- File `vercel.json` đã được tạo trong thư mục `frontend` để xử lý SPA routing
- Nếu vẫn gặp lỗi, đảm bảo file `vercel.json` có trong repo và được deploy
- Redeploy lại frontend sau khi thêm file `vercel.json`

