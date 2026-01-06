# Mô Tả Dự Án - AI Lesson Plan Generator

## Tổng Quan

**AI Lesson Plan Generator** là ứng dụng web hỗ trợ giáo viên soạn giáo án tự động theo chuẩn **Công văn 2345/BGDĐT-GDTrH** của Bộ Giáo dục và Đào tạo Việt Nam. Ứng dụng sử dụng công nghệ AI (Google Gemini) để tạo giáo án chi tiết, đầy đủ với định dạng chuyên nghiệp, hỗ trợ xuất file Word (.docx) để giáo viên có thể sử dụng trực tiếp.

## Chức Năng Chính

### 1. **Quản Lý Người Dùng**

- Đăng ký/Đăng nhập tài khoản
- Xác thực qua email
- Đăng nhập bằng Google OAuth
- Quản lý profile cá nhân
- Quên mật khẩu và đặt lại mật khẩu

### 2. **Tạo Giáo Án Tự Động**

- Tạo giáo án theo chuẩn Công văn 2345 với AI
- Upload tài liệu hỗ trợ (hình ảnh, PDF) để làm ngữ cảnh
- Tùy chỉnh thông tin: môn học, lớp, cấp học, số tiết
- Tạo giáo án với định dạng markdown (bảng, in đậm, in nghiêng, danh sách)
- Hỗ trợ nhiều tiết học trong một giáo án

### 3. **Xem và Quản Lý Giáo Án**

- Xem chi tiết giáo án với định dạng markdown đẹp mắt
- Tải xuống giáo án dưới dạng file Word (.docx)
- Lưu trữ và quản lý lịch sử giáo án (My Documents)
- Chỉnh sửa và xóa giáo án
- Tìm kiếm và lọc giáo án

### 4. **Thanh Toán và Gói Dịch Vụ**

- Đăng ký gói subscription (1 tháng, 3 tháng, 6 tháng)
- Thanh toán qua MoMo (ATM, Credit Card, Ví MoMo)
- Quản lý gói đang sử dụng
- Tích lũy thời gian subscription khi đăng ký gói mới

### 5. **Admin Dashboard**

- Quản lý người dùng và giáo án
- Thống kê tổng quan (số người dùng, giáo án, doanh thu)
- Xem biểu đồ và báo cáo
- Quản lý subscription và thanh toán

### 6. **Giao Diện Người Dùng**

- Giao diện responsive, thân thiện
- Dark mode / Light mode
- Keyboard shortcuts hỗ trợ
- Trang trợ giúp và chính sách

## Công Cụ Sử Dụng

### Frontend

#### Core Framework & Language

- **React 18** - UI framework
- **TypeScript** - Ngôn ngữ lập trình
- **Vite** - Build tool và dev server

#### UI Libraries & Styling

- **Material-UI (MUI) v5** - Component library
  - `@mui/material` - Core components
  - `@mui/icons-material` - Icon set
  - `@emotion/react` & `@emotion/styled` - CSS-in-JS
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** & **Autoprefixer** - CSS processing

#### Routing & State Management

- **React Router DOM v6** - Client-side routing
- **React Context API** - State management (Auth, Theme)

#### HTTP & API

- **Axios** - HTTP client

#### Content Rendering

- **ReactMarkdown** - Render markdown content
- **remark-gfm** - GitHub Flavored Markdown support (tables, etc.)

#### Charts & Visualization

- **Recharts** - Chart library cho Admin Dashboard

#### Notifications

- **React Hot Toast** - Toast notifications

#### Development Tools

- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting

---

### Backend

#### Core Framework & Language

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Ngôn ngữ lập trình

#### Database & ODM

- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

#### Authentication & Security

- **JWT (jsonwebtoken)** - JSON Web Tokens cho authentication
- **bcryptjs** - Password hashing
- **Passport.js** - Authentication middleware
  - `passport-google-oauth20` - Google OAuth 2.0 strategy
- **express-session** - Session management

#### AI Integration

- **@google/generative-ai** - Google Gemini AI SDK

#### File Processing

- **Multer** - File upload middleware
- **Sharp** - Image processing và optimization
- **pdf-parse** - PDF text extraction
- **mammoth** - Convert Word documents

#### Document Generation

- **docx** - Generate Word (.docx) documents

#### Payment Gateway

- **MoMo Payment API** - Tích hợp thanh toán MoMo (ATM, Credit Card, Ví MoMo)

#### Cloud Storage

- **AWS SDK S3** - Amazon S3 storage cho file uploads

#### Email Service

- **Nodemailer** - Email sending (xác thực tài khoản, quên mật khẩu)

#### Validation & Middleware

- **express-validator** - Request validation
- **CORS** - Cross-Origin Resource Sharing

#### Development Tools

- **Nodemon** - Auto-restart server trong development
- **ts-node** - TypeScript execution
- **TypeScript** - Type checking và compilation

---

## Kiến Trúc

- **Frontend**: Single Page Application (SPA) với React Router
- **Backend**: RESTful API với Express.js
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT-based authentication + Google OAuth
- **AI Service**: Google Gemini API integration
- **Payment**: MoMo Payment Gateway
- **Storage**: AWS S3 cho file uploads
- **Deployment**:
  - Frontend: Vercel
  - Backend: Render

## Cấu Trúc Giáo Án (Công Văn 2345)

Giáo án được tạo tự động bao gồm:

1. **I. YÊU CẦU CẦN ĐẠT**

   - Năng lực đặc thù
   - Năng lực chung
   - Phẩm chất

2. **II. ĐỒ DÙNG DẠY HỌC**

   - Cho giáo viên
   - Cho học sinh

3. **III. CÁC HOẠT ĐỘNG DẠY HỌC**

   - Hoạt động mở đầu
   - Hoạt động khám phá (với bảng tổ chức hoạt động)
   - Hoạt động luyện tập
   - Hoạt động vận dụng
   - Hỗ trợ nhiều tiết học

4. **IV. ĐIỀU CHỈNH SAU BÀI DẠY**
   - Nhận xét chung
