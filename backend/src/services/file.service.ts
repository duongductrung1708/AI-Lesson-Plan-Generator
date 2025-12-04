import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 client if AWS credentials are provided
const s3Client = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

interface FileContent {
  text?: string;
  imageBase64?: string;
  mimeType: string;
}

/**
 * Extract text from PDF buffer
 */
const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || '';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  } finally {
    // Cleanup parser resources
    if (parser) {
      try {
        await parser.destroy();
      } catch (destroyError) {
        console.error('Error destroying PDF parser:', destroyError);
      }
    }
  }
};

/**
 * Extract text from Word (.docx) buffer
 */
const extractTextFromWord = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('Error extracting text from Word:', error);
    return '';
  }
};

/**
 * Convert image to base64
 */
const convertImageToBase64 = async (buffer: Buffer, mimeType: string): Promise<string> => {
  try {
    // Resize large images to reduce token usage (max 1024px on longest side)
    const resizedBuffer = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    
    return resizedBuffer.toString('base64');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return buffer.toString('base64');
  }
};

/**
 * Get file from AWS S3
 */
const getFileFromS3 = async (s3Url: string): Promise<Buffer> => {
  if (!s3Client) {
    throw new Error('AWS S3 client not configured');
  }

  try {
    // Parse S3 URL: s3://bucket-name/path/to/file or https://bucket.s3.region.amazonaws.com/path
    let bucket: string;
    let key: string;

    if (s3Url.startsWith('s3://')) {
      const urlParts = s3Url.replace('s3://', '').split('/');
      bucket = urlParts[0];
      key = urlParts.slice(1).join('/');
    } else if (s3Url.includes('.s3.') || s3Url.includes('s3.amazonaws.com')) {
      // Parse HTTPS S3 URL
      const url = new URL(s3Url);
      bucket = url.hostname.split('.')[0];
      key = url.pathname.substring(1); // Remove leading /
    } else {
      throw new Error(`Invalid S3 URL format: ${s3Url}`);
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const stream = response.Body as Readable;
    
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    
    return Buffer.concat(chunks);
  } catch (error: any) {
    console.error('Error getting file from S3:', error);
    throw new Error(`Failed to get file from S3: ${error.message}`);
  }
};

/**
 * Get file from local storage
 */
const getFileFromLocal = async (filePath: string): Promise<Buffer> => {
  try {
    // Handle both absolute and relative paths
    const fullPath = filePath.startsWith('/') || filePath.includes(':')
      ? filePath
      : path.join(__dirname, '../../uploads', filePath.replace('/uploads/', ''));
    
    return fs.readFileSync(fullPath);
  } catch (error: any) {
    console.error('Error reading local file:', error);
    throw new Error(`Failed to read local file: ${error.message}`);
  }
};

/**
 * Process file and extract content for AI
 */
export const processFileForAI = async (fileUrl: string): Promise<FileContent | null> => {
  try {
    let buffer: Buffer;
    let mimeType: string;

    // Determine if file is from S3 or local
    if (fileUrl.startsWith('s3://') || fileUrl.includes('.s3.') || fileUrl.includes('s3.amazonaws.com')) {
      buffer = await getFileFromS3(fileUrl);
      // Try to detect MIME type from file extension or S3 metadata
      const extension = fileUrl.split('.').pop()?.toLowerCase();
      mimeType = extension === 'pdf' 
        ? 'application/pdf'
        : extension === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : extension === 'png'
        ? 'image/png'
        : extension === 'jpg' || extension === 'jpeg'
        ? 'image/jpeg'
        : 'application/octet-stream';
    } else {
      // Local file
      buffer = await getFileFromLocal(fileUrl);
      const extension = fileUrl.split('.').pop()?.toLowerCase();
      mimeType = extension === 'pdf' 
        ? 'application/pdf'
        : extension === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : extension === 'png'
        ? 'image/png'
        : extension === 'jpg' || extension === 'jpeg'
        ? 'image/jpeg'
        : 'application/octet-stream';
    }

    // Process based on file type
    if (mimeType === 'application/pdf') {
      const text = await extractTextFromPDF(buffer);
      return {
        text,
        mimeType,
      };
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const text = await extractTextFromWord(buffer);
      return {
        text,
        mimeType,
      };
    } else if (mimeType.startsWith('image/')) {
      const imageBase64 = await convertImageToBase64(buffer, mimeType);
      return {
        imageBase64,
        mimeType,
      };
    } else {
      console.warn(`Unsupported file type: ${mimeType}`);
      return null;
    }
  } catch (error: any) {
    console.error(`Error processing file ${fileUrl}:`, error);
    return null;
  }
};

/**
 * Process multiple files and return their contents
 */
export const processFilesForAI = async (fileUrls: string[]): Promise<{
  pdfTexts: string[];
  images: Array<{ base64: string; mimeType: string }>;
}> => {
  const pdfTexts: string[] = [];
  const images: Array<{ base64: string; mimeType: string }> = [];

  for (const fileUrl of fileUrls) {
    const content = await processFileForAI(fileUrl);
    if (content) {
      if (content.text) {
        pdfTexts.push(content.text);
      }
      if (content.imageBase64) {
        images.push({
          base64: content.imageBase64,
          mimeType: content.mimeType,
        });
      }
    }
  }

  return { pdfTexts, images };
};

/**
 * Upload file to AWS S3
 */
export const uploadFileToS3 = async (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> => {
  if (!s3Client) {
    throw new Error('AWS S3 client not configured');
  }

  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET not configured');
  }

  try {
    // Create unique key with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = filename.split('.').pop() || '';
    const key = `uploads/${uniqueSuffix}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Make file publicly readable (optional, can be removed if you want private files)
      // ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return S3 URL
    const region = process.env.AWS_REGION || 'us-east-1';
    return `s3://${bucket}/${key}`;
  } catch (error: any) {
    console.error('Error uploading file to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Delete file from AWS S3
 */
export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  if (!s3Client) {
    throw new Error('AWS S3 client not configured');
  }

  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET not configured');
  }

  try {
    // Parse S3 URL: s3://bucket-name/path/to/file or https://bucket.s3.region.amazonaws.com/path
    let key: string;

    if (fileUrl.startsWith('s3://')) {
      const urlParts = fileUrl.replace('s3://', '').split('/');
      // Remove bucket name from parts
      key = urlParts.slice(1).join('/');
    } else if (fileUrl.includes('.s3.') || fileUrl.includes('s3.amazonaws.com')) {
      // Parse HTTPS S3 URL
      const url = new URL(fileUrl);
      key = url.pathname.substring(1); // Remove leading /
    } else {
      // If it's not an S3 URL, skip deletion
      console.log(`Skipping deletion - not an S3 URL: ${fileUrl}`);
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`File deleted from S3: ${key}`);
  } catch (error: any) {
    console.error(`Error deleting file from S3 (${fileUrl}):`, error);
    // Don't throw error - just log it, so deletion can continue for other files
  }
};

/**
 * Delete file from local storage
 */
export const deleteFileFromLocal = async (filePath: string): Promise<void> => {
  try {
    // Handle both absolute and relative paths
    const fullPath = filePath.startsWith('/') || filePath.includes(':')
      ? filePath
      : path.join(__dirname, '../../uploads', filePath.replace('/uploads/', ''));

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`File deleted from local storage: ${fullPath}`);
    } else {
      console.log(`File not found in local storage: ${fullPath}`);
    }
  } catch (error: any) {
    console.error(`Error deleting local file (${filePath}):`, error);
    // Don't throw error - just log it
  }
};

/**
 * Delete file from storage (S3 or local)
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  // Determine if file is from S3 or local
  if (fileUrl.startsWith('s3://') || fileUrl.includes('.s3.') || fileUrl.includes('s3.amazonaws.com')) {
    await deleteFileFromS3(fileUrl);
  } else {
    await deleteFileFromLocal(fileUrl);
  }
};

/**
 * Delete multiple files from storage
 */
export const deleteFiles = async (fileUrls: string[]): Promise<void> => {
  // Delete all files in parallel, but don't fail if one fails
  await Promise.allSettled(fileUrls.map(url => deleteFile(url)));
};

/**
 * Check if S3 is configured
 */
export const isS3Configured = (): boolean => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

