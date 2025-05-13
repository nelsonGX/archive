import fs from 'fs';
import path from 'path';
import { encryptData, decryptData } from './serverEncryption';

// Define storage directory - create uploads directory at project root
const STORAGE_DIR = path.join(process.cwd(), 'uploads');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Encrypts and saves a file to server storage
 * @param fileId Unique file ID to use as filename
 * @param data File data as Buffer
 * @param encryptionKey Encryption key (hex)
 * @param encryptionIv Initialization vector (hex)
 * @returns Promise that resolves to the file path
 */
export async function saveEncryptedFile(
  fileId: string,
  data: Buffer,
  encryptionKey: string,
  encryptionIv: string
): Promise<string> {
  try {
    // Encrypt the data using server-side encryption
    const encryptedData = encryptData(data, encryptionKey, encryptionIv);
    
    // Create file path
    const filePath = path.join(STORAGE_DIR, fileId);
    
    // Write encrypted data to file
    fs.writeFileSync(filePath, encryptedData);
    
    return filePath;
  } catch (error) {
    console.error('Error in saveEncryptedFile:', error);
    throw new Error('Failed to encrypt and save file to server storage');
  }
}

/**
 * Retrieves and decrypts a file from server storage
 * @param fileId Unique file ID
 * @param encryptionKey Encryption key (hex)
 * @param encryptionIv Initialization vector (hex)
 * @returns Promise that resolves to decrypted file data as Buffer
 */
export async function getDecryptedFile(
  fileId: string,
  encryptionKey: string,
  encryptionIv: string
): Promise<Buffer> {
  try {
    // Create file path
    const filePath = path.join(STORAGE_DIR, fileId);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    // Read encrypted data from file
    const encryptedData = fs.readFileSync(filePath, 'utf8');
    
    // Decrypt the data
    return decryptData(encryptedData, encryptionKey, encryptionIv);
  } catch (error) {
    console.error('Error in getDecryptedFile:', error);
    throw new Error('Failed to retrieve and decrypt file from server storage');
  }
}

/**
 * Deletes a file from server storage
 * @param fileId Unique file ID
 * @returns Promise that resolves when file is deleted
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    // Create file path
    const filePath = path.join(STORAGE_DIR, fileId);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    // Delete file
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error in deleteFile:', error);
    throw new Error('Failed to delete file from server storage');
  }
}

/**
 * Checks if a file exists in server storage
 * @param fileId Unique file ID
 * @returns True if file exists, false otherwise
 */
export function fileExists(fileId: string): boolean {
  const filePath = path.join(STORAGE_DIR, fileId);
  return fs.existsSync(filePath);
}

/**
 * Generates a unique file ID
 * @returns Unique file ID
 */
export function generateUniqueFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}