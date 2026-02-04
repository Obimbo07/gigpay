import { DocumentType, IMAGE_VALIDATION, ImageValidationResult } from '@/types';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Validate image/document file for KYC upload
 */
export async function validateKYCDocument(
  file: { uri: string; type?: string; size?: number; name?: string },
  fileType: 'document' | 'selfie'
): Promise<ImageValidationResult> {
  const config = IMAGE_VALIDATION[fileType === 'document' ? 'DOCUMENT' : 'SELFIE'];
  
  // Check file type
  const mimeType = file.type?.toLowerCase() || '';
  const fileName = file.name?.toLowerCase() || '';
  
  const hasValidMimeType = config.ALLOWED_TYPES.some(type => mimeType.includes(type));
  const hasValidExtension = config.ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidMimeType && !hasValidExtension) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${config.ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }
  
  // Check file size
  if (file.size && file.size > config.MAX_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds ${config.MAX_SIZE_MB}MB limit`,
    };
  }
  
  return {
    isValid: true,
    file: {
      uri: file.uri,
      type: mimeType,
      size: file.size || 0,
      name: file.name || 'unknown',
    },
  };
}

/**
 * Compress image before upload to reduce file size
 */
export async function compressImage(
  uri: string,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<string> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // Return original if compression fails
  }
}

/**
 * Get file extension from URI
 */
export function getFileExtension(uri: string): string {
  const match = uri.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Generate unique filename for storage
 */
export function generateKYCFilename(
  userId: string,
  fileType: 'document' | 'selfie',
  documentType?: DocumentType
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  if (fileType === 'document' && documentType) {
    return `${userId}/${documentType}_${timestamp}_${random}.jpg`;
  }
  
  return `${userId}/${fileType}_${timestamp}_${random}.jpg`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
