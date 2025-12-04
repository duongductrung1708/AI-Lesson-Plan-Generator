# Hướng dẫn Cấu hình Google Gemini AI

## 1. Lấy Gemini API Key và Enable API

### Bước 1: Tạo Project và Enable API

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Library**
4. Tìm và enable **"Generative Language API"** (quan trọng!)
5. Đợi vài phút để API được kích hoạt

### Bước 2: Lấy API Key

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng tài khoản Google của bạn
3. Click **"Create API Key"** hoặc **"Get API Key"**
4. Chọn project đã enable Generative Language API
5. Copy API key được tạo

**LƯU Ý QUAN TRỌNG**: Nếu không enable Generative Language API, bạn sẽ gặp lỗi 404 "model not found"

## 2. Cấu hình trong Backend

Thêm vào file `backend/.env`:

```env
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
```

**Lưu ý về Model:**
- `gemini-2.5-flash`: Model mới nhất, nhanh nhất, mặc định (khuyến nghị)
- `gemini-1.5-flash`: Nhanh, rẻ, phù hợp cho hầu hết trường hợp
- `gemini-1.5-pro`: Mạnh nhất, phù hợp cho tác vụ phức tạp
- `gemini-pro`: Model cơ bản, tương thích tốt nhất

Nếu gặp lỗi 404 với model, thử đổi sang `gemini-1.5-flash` hoặc `gemini-pro`.

## 3. Cấu hình AWS S3 (Để lưu file upload)

### Bước 1: Tạo AWS Account và S3 Bucket

1. Đăng ký tài khoản [AWS](https://aws.amazon.com/)
2. Vào **S3** service
3. Tạo bucket mới:
   - Chọn region (ví dụ: `us-east-1`)
   - Đặt tên bucket (ví dụ: `ai-lesson-plan-files`)
   - **Quan trọng**: Ghi nhớ region và bucket name
   - Cấu hình permissions:
     - **Block Public Access**: Có thể bật hoặc tắt tùy nhu cầu
     - Nếu muốn file public: Tắt "Block all public access"
     - Nếu muốn file private: Giữ "Block all public access" (mặc định)

### Bước 2: Tạo IAM User với quyền truy cập S3

1. Vào **IAM** service
2. Tạo user mới:
   - Username: `ai-lesson-plan-s3-user`
   - Access type: **Programmatic access** (chọn "Access key - Programmatic access")
3. Attach policy:
   - **Option 1**: `AmazonS3FullAccess` (đơn giản, nhưng quyền rộng)
   - **Option 2**: Custom policy với quyền hạn chế hơn (khuyến nghị cho production):
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "s3:PutObject",
             "s3:GetObject",
             "s3:DeleteObject"
           ],
           "Resource": "arn:aws:s3:::your-bucket-name/*"
         },
         {
           "Effect": "Allow",
           "Action": [
             "s3:ListBucket"
           ],
           "Resource": "arn:aws:s3:::your-bucket-name"
         }
       ]
     }
     ```
4. Lưu **Access Key ID** và **Secret Access Key** (chỉ hiển thị 1 lần!)

### Bước 3: Thêm vào `.env`

```env
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Bước 4: Cách hoạt động

- **Nếu S3 được cấu hình**: File sẽ tự động upload lên S3
- **Nếu S3 không được cấu hình**: File sẽ lưu vào local storage (`backend/uploads/`)
- **Nếu S3 upload thất bại**: Tự động fallback về local storage
- File URL trả về:
  - S3: `s3://bucket-name/path/to/file`
  - Local: `/uploads/filename.ext`

## 4. Cách hoạt động

### Với Gemini API:
- Ứng dụng sẽ sử dụng **Gemini 1.5 Pro** để tạo giáo án
- Nếu không có API key, sẽ fallback về mock service
- Gemini sẽ phân tích:
  - Thông tin đầu vào (môn học, lớp, tên bài, v.v.)
  - Nội dung từ file PDF đã upload (nếu có)
  - Hình ảnh từ file đã upload (nếu có)
- Tạo giáo án theo đúng cấu trúc Công văn 2345

### Với AWS S3:
- **File upload tự động lên S3** nếu được cấu hình
- Hỗ trợ đọc file từ cả 2 nguồn:
  - S3 URL: `s3://bucket-name/path/to/file`
  - HTTPS URL: `https://bucket.s3.region.amazonaws.com/path/to/file`
  - Local URL: `/uploads/filename.pdf`
- File được lưu trong thư mục `uploads/` trên S3 với tên unique

## 5. Xử lý File

### PDF Files:
- Text được extract từ PDF
- Gửi text content đến Gemini làm ngữ cảnh

### Image Files (JPG, PNG):
- Ảnh được resize (max 1024px) để giảm token usage
- Convert sang base64
- Gửi đến Gemini dưới dạng multimodal input

## 6. Error Handling

- **Retry Logic**: Tự động retry 3 lần nếu API call thất bại
- **Fallback**: Nếu Gemini API lỗi, sẽ sử dụng mock service
- **File Processing**: Nếu file không đọc được, sẽ bỏ qua và tiếp tục với thông tin đầu vào

## 7. Model Configuration

Hiện tại sử dụng:
- **Model**: `gemini-1.5-pro`
- **Safety Settings**: Block medium and above cho các nội dung không phù hợp

## 8. Troubleshooting

### Lỗi: "GEMINI_API_KEY not found"
- Kiểm tra file `.env` có chứa `GEMINI_API_KEY`
- Đảm bảo không có khoảng trắng thừa
- Khởi động lại server sau khi thêm key

### Lỗi: "Failed to upload file to S3"
- Kiểm tra AWS credentials trong `.env`
- Kiểm tra bucket name và region có đúng không
- Kiểm tra IAM user có quyền `s3:PutObject` không
- Kiểm tra bucket có tồn tại không
- Ứng dụng sẽ tự động fallback về local storage nếu S3 upload thất bại

### Lỗi: "Failed to get file from S3"
- Kiểm tra AWS credentials trong `.env`
- Kiểm tra bucket name và region
- Kiểm tra IAM user có quyền `s3:GetObject` không
- Kiểm tra format URL (s3:// hoặc https://)
- Kiểm tra file có tồn tại trên S3 không

### Lỗi: "Model not found" (404) - QUAN TRỌNG NHẤT

Đây là lỗi phổ biến nhất. Nguyên nhân và cách sửa:

**Nguyên nhân 1: Generative Language API chưa được enable**
- Vào [Google Cloud Console](https://console.cloud.google.com/)
- Chọn project của bạn
- Vào **APIs & Services** > **Library**
- Tìm **"Generative Language API"**
- Click **Enable** và đợi vài phút

**Nguyên nhân 2: API key không đúng project**
- Đảm bảo API key được tạo từ project đã enable Generative Language API
- Tạo lại API key nếu cần

**Nguyên nhân 3: Model name không đúng**
- Thử các model name sau trong `.env`:
  - `GEMINI_MODEL=gemini-2.5-flash` (mặc định, khuyến nghị)
  - `GEMINI_MODEL=gemini-1.5-flash`
  - `GEMINI_MODEL=gemini-1.5-pro`
  - `GEMINI_MODEL=gemini-pro`

**Nguyên nhân 4: API key chưa có billing enabled (nếu cần)**
- Một số model có thể yêu cầu billing account
- Kiểm tra trong Google Cloud Console

**Cách kiểm tra:**
1. Vào [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Thử tạo một request test với API key của bạn
3. Nếu vẫn lỗi, kiểm tra lại các bước trên

### Lỗi: "Error parsing Gemini response"
- Gemini có thể trả về response không đúng format JSON
- Ứng dụng sẽ tự động fallback về mock service
- Kiểm tra prompt có đúng format không

### Response quá chậm
- Gemini API có thể mất vài giây để xử lý
- File lớn (nhiều ảnh) sẽ làm tăng thời gian xử lý
- Cân nhắc giảm số lượng file hoặc resize ảnh trước khi upload

## 9. Cost Estimation

- **Gemini 1.5 Pro**: 
  - Input: ~$3.50 per 1M tokens
  - Output: ~$10.50 per 1M tokens
- **AWS S3**:
  - Storage: ~$0.023 per GB/month
  - Requests: ~$0.0004 per 1000 requests

## 10. Best Practices

1. **API Key Security**: 
   - Không commit API key lên Git
   - Sử dụng environment variables
   - Rotate keys định kỳ

2. **File Management**:
   - Giới hạn kích thước file (hiện tại: 10MB)
   - Xóa file cũ không cần thiết
   - Sử dụng S3 lifecycle policies

3. **Error Monitoring**:
   - Log errors để theo dõi
   - Set up alerts cho API failures
   - Monitor API usage và costs

