import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { logger } from '../utils/logger';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export class StorageService {
  private static storage: Storage;
  private static bucketName: string;

  static initialize() {
    if (!this.storage) {
      this.storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        keyFilename: process.env.GCP_KEY_FILE,
      });
      this.bucketName = process.env.GCP_STORAGE_BUCKET || 'cafeteria-lite-images';
    }
  }

  /**
   * Upload product image with optimization
   */
  static async uploadProductImage(
    fileBuffer: Buffer,
    originalFilename: string,
    cafeteriaId: string,
    productId?: string
  ): Promise<UploadResult> {
    this.initialize();

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const fileType = await this.getFileType(fileBuffer);

      if (!allowedTypes.includes(fileType)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      }

      // Optimize image
      const optimizedBuffer = await this.optimizeImage(fileBuffer, fileType);

      // Generate unique filename
      const extension = fileType.split('/')[1];
      const filename = `products/${cafeteriaId}/${productId || 'temp'}/${uuidv4()}.${extension}`;

      // Upload to GCS
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filename);

      await file.save(optimizedBuffer, {
        metadata: {
          contentType: fileType,
          metadata: {
            originalFilename,
            uploadedAt: new Date().toISOString(),
            cafeteriaId,
            productId: productId || 'temp',
          },
        },
        public: true, // Make publicly accessible
      });

      // Generate public URL
      const url = `https://storage.googleapis.com/${this.bucketName}/${filename}`;

      logger.info('Product image uploaded successfully', {
        filename,
        size: optimizedBuffer.length,
        cafeteriaId,
        productId,
      });

      return {
        url,
        filename,
        size: optimizedBuffer.length,
        mimeType: fileType,
      };
    } catch (error) {
      logger.error('Failed to upload product image', error);
      throw error;
    }
  }

  /**
   * Delete product image
   */
  static async deleteProductImage(filename: string, cafeteriaId: string): Promise<void> {
    this.initialize();

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filename);

      // Verify the file belongs to the cafeteria
      const [metadata] = await file.getMetadata();
      if (metadata.metadata?.cafeteriaId !== cafeteriaId) {
        throw new Error('Unauthorized to delete this image');
      }

      await file.delete();

      logger.info('Product image deleted successfully', { filename, cafeteriaId });
    } catch (error) {
      logger.error('Failed to delete product image', error);
      throw error;
    }
  }

  /**
   * Get file type from buffer
   */
  private static async getFileType(buffer: Buffer): Promise<string> {
    const { fileTypeFromBuffer } = await import('file-type');
    const result = await fileTypeFromBuffer(buffer);

    if (!result) {
      throw new Error('Unable to determine file type');
    }

    return result.mime;
  }

  /**
   * Optimize image for web delivery
   */
  private static async optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      let sharpInstance = sharp(buffer);

      // Get image info
      const metadata = await sharpInstance.metadata();

      // Resize if too large (max 1200px width, maintain aspect ratio)
      if (metadata.width && metadata.width > 1200) {
        sharpInstance = sharpInstance.resize(1200, null, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      // Convert to WebP for better compression (except if already WebP)
      if (mimeType !== 'image/webp') {
        sharpInstance = sharpInstance.webp({
          quality: 85, // Good balance of quality/size
          effort: 6,   // Higher effort for better compression
        });
      } else {
        // If already WebP, just compress
        sharpInstance = sharpInstance.webp({ quality: 85 });
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      logger.warn('Image optimization failed, using original', error);
      return buffer; // Return original if optimization fails
    }
  }

  /**
   * Validate image upload request
   */
  static validateImageUpload(file: Express.Multer.File): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum 5MB allowed.');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }
  }
}