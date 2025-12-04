# Hướng dẫn Cấu hình Google OAuth và Email

## 1. Cấu hình Google OAuth

### Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Điền thông tin:
   - **Name**: AI Lesson Plan Generator
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs** (QUAN TRỌNG - phải khớp chính xác):
     - `http://localhost:5000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
       **LƯU Ý**:
   - URL phải khớp CHÍNH XÁC, bao gồm cả `http://` hoặc `https://`
   - Không có dấu `/` ở cuối
   - Nếu bạn thay đổi `BACKEND_URL` trong `.env`, phải cập nhật lại trong Google Cloud Console
   - Sau khi thêm URL, có thể mất vài phút để có hiệu lực
7. Copy **Client ID** và **Client Secret**

### Bước 2: Cấu hình trong Backend

Thêm vào file `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## 2. Cấu hình Email (SMTP)

### Option A: Gmail (Khuyến nghị cho development)

1. Bật **2-Step Verification** cho Gmail của bạn
2. Tạo **App Password**:

   - Vào [Google Account](https://myaccount.google.com/)
   - Security > 2-Step Verification > App passwords
   - Tạo app password mới cho "Mail"
   - Copy password (16 ký tự)

3. Thêm vào `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Option B: Email Service khác (SendGrid, Mailgun, etc.)

#### SendGrid:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## 3. Cấu hình Environment Variables

Tạo file `backend/.env` với nội dung:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-lesson-plan
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d
NODE_ENV=development

# Frontend & Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Session Secret
SESSION_SECRET=your-session-secret-change-this-in-production

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# AWS S3 Configuration (for file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## 4. Cài đặt Dependencies

```bash
cd backend
npm install
```

## 5. Test

1. Khởi động backend:

```bash
npm run dev
```

2. Khởi động frontend:

```bash
cd ../frontend
npm start
```

3. Test đăng ký:

   - Đăng ký tài khoản mới
   - Kiểm tra email để nhận link kích hoạt
   - Click vào link để kích hoạt tài khoản

4. Test Google OAuth:
   - Click "Đăng nhập với Google"
   - Chọn tài khoản Google
   - Tự động đăng nhập

## Lưu ý

- **Development**: Sử dụng Gmail với App Password
- **Production**: Nên sử dụng email service chuyên nghiệp (SendGrid, Mailgun, AWS SES)
- **Google OAuth**: Đảm bảo redirect URI khớp chính xác
- **Security**: Không commit file `.env` lên Git

## Troubleshooting

### Email không gửi được

- Kiểm tra SMTP credentials
- Đảm bảo App Password đúng (Gmail)
- Kiểm tra firewall/antivirus không chặn port 587
- Thử dùng port 465 với `secure: true`

### Google OAuth không hoạt động

#### Lỗi: "redirect_uri_mismatch" (Error 400)

**Nguyên nhân**: Callback URL trong code không khớp với URL đã đăng ký trong Google Cloud Console.

**Cách sửa**:

1. Kiểm tra callback URL trong console khi khởi động server (sẽ hiển thị khi server start)
2. Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Click vào OAuth 2.0 Client ID của bạn
4. Trong phần **Authorized redirect URIs**, thêm chính xác URL mà server hiển thị
   - Ví dụ: `http://localhost:5000/api/auth/google/callback`
5. **Lưu ý quan trọng**:
   - URL phải khớp CHÍNH XÁC, bao gồm cả `http://` hoặc `https://`
   - Không có dấu `/` ở cuối
   - Phân biệt chữ hoa/thường
   - Sau khi thêm, đợi 1-2 phút để có hiệu lực
6. Click **Save** và thử lại

#### Các lỗi khác:

- Kiểm tra Client ID và Secret trong `.env`
- Đảm bảo redirect URI khớp chính xác
- Kiểm tra Google Cloud Console đã enable OAuth consent screen
- Kiểm tra OAuth consent screen đã được publish (nếu cần)
