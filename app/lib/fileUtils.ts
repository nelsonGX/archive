import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { encryptData, decryptData, generateEncryptionKey } from './encryption';

// Base directory for file storage
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Ensures the upload directory exists
 */
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Generates a unique filename using original name and random string
 * @param originalFilename Original filename
 * @returns Unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const fileExt = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, fileExt);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  
  return `${baseName}-${timestamp}-${randomString}${fileExt}`;
}

/**
 * Stores an encrypted file
 * @param fileBuffer File data as Buffer
 * @param originalFilename Original filename
 * @returns Object with stored file details
 */
export async function storeEncryptedFile(fileBuffer: Buffer, originalFilename: string) {
  await ensureUploadDir();
  
  // Generate a unique filename
  const uniqueFilename = generateUniqueFilename(originalFilename);
  const filePath = path.join(UPLOAD_DIR, uniqueFilename);
  
  // Generate encryption key and iv
  const { key, iv } = generateEncryptionKey();
  
  // Encrypt the file data
  const encryptedData = encryptData(fileBuffer, key, iv);
  
  // Save the encrypted data
  await fs.writeFile(filePath, encryptedData);
  
  return {
    filePath: uniqueFilename,
    encryptionKey: key,
    encryptionIv: iv,
    size: fileBuffer.length,
    originalName: originalFilename
  };
}

/**
 * Retrieves and decrypts a file
 * @param filename Stored filename
 * @param key Encryption key
 * @param iv Initialization vector
 * @returns Decrypted file buffer
 */
export async function getDecryptedFile(filename: string, key: string, iv: string): Promise<Buffer> {
  const filePath = path.join(UPLOAD_DIR, filename);
  
  // Check if file exists
  if (!existsSync(filePath)) {
    throw new Error('File not found');
  }
  
  // Read encrypted data
  const encryptedData = await fs.readFile(filePath, 'utf-8');
  
  // Decrypt the data
  return decryptData(encryptedData, key, iv);
}

/**
 * Deletes a file from storage
 * @param filename Filename to delete
 */
export async function deleteFile(filename: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, filename);
  
  if (existsSync(filePath)) {
    await fs.unlink(filePath);
  }
}