import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/auth.middleware';
import { uploadFileToS3, isS3Configured } from '../services/file.service';

const router = express.Router();

// Ensure uploads directory exists (for fallback to local storage)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer with memory storage (we'll handle S3 upload ourselves)
const storage = multer.memoryStorage();

const fileFilter = (
  req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|pdf|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype) || 
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép tải lên file JPG, PNG, PDF hoặc DOCX'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

// Upload route
router.post('/', protect, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file để tải lên',
      });
    }

    const files = req.files as Express.Multer.File[];
    const fileUrls: string[] = [];
    const useS3 = isS3Configured();

    for (const file of files) {
      try {
        if (useS3) {
          // Upload to S3
          const s3Url = await uploadFileToS3(
            file.buffer,
            file.originalname,
            file.mimetype
          );
          fileUrls.push(s3Url);
          console.log(`File uploaded to S3: ${s3Url}`);
        } else {
          // Fallback to local storage
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
          const filepath = path.join(uploadsDir, filename);
          
          fs.writeFileSync(filepath, file.buffer);
          fileUrls.push(`/uploads/${filename}`);
          console.log(`File saved locally: ${filename}`);
        }
      } catch (error: any) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        // If S3 upload fails, try local fallback
        if (useS3) {
          try {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
            const filepath = path.join(uploadsDir, filename);
            
            fs.writeFileSync(filepath, file.buffer);
            fileUrls.push(`/uploads/${filename}`);
            console.log(`S3 upload failed, saved locally: ${filename}`);
          } catch (localError: any) {
            console.error(`Failed to save file locally:`, localError);
            return res.status(500).json({
              success: false,
              message: `Lỗi khi lưu file ${file.originalname}`,
              error: localError.message,
            });
          }
        } else {
          return res.status(500).json({
            success: false,
            message: `Lỗi khi lưu file ${file.originalname}`,
            error: error.message,
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Tải lên file thành công',
      files: fileUrls,
      storage: useS3 ? 's3' : 'local',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên file',
      error: error.message,
    });
  }
});

export default router;
