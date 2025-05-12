'use client';

import { generateEncryptionKey, encryptData, decryptData } from './encryption';

const DB_NAME = 'archiveDB';
const DB_VERSION = 1;
const FILE_STORE = 'files';

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

// Initialize IndexedDB
async function openDatabase(): Promise<IDBDatabase> {
  // Check if running in browser
  if (!isBrowser) {
    throw new Error('IndexedDB can only be accessed in browser environment');
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open database'));

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Generates a unique filename
 * @param originalFilename Original filename
 * @returns Unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? originalFilename.slice(0, lastDotIndex) : originalFilename;
  const extension = lastDotIndex !== -1 ? originalFilename.slice(lastDotIndex) : '';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  
  return `${baseName}-${timestamp}-${randomStr}${extension}`;
}

/**
 * Stores an encrypted file in IndexedDB
 * @param fileBuffer File data as ArrayBuffer
 * @param fileId Optional unique ID to use instead of generating one
 * @param encryptionKey Optional encryption key to use
 * @param encryptionIv Optional initialization vector to use
 * @param originalFilename Original filename
 * @returns Object with stored file details
 */
export async function storeEncryptedFile(
  fileBuffer: ArrayBuffer,
  fileId?: string,
  encryptionKey?: string,
  encryptionIv?: string,
  originalFilename?: string
) {
  // Use provided ID or generate a unique one
  const uniqueId = fileId || generateUniqueFilename(originalFilename || 'file');

  // Use provided encryption parameters or generate new ones
  const { key, iv } = encryptionKey && encryptionIv
    ? { key: encryptionKey, iv: encryptionIv }
    : generateEncryptionKey();

  // Convert ArrayBuffer to Buffer-like object for encryption
  const buffer = new Uint8Array(fileBuffer);

  // Encrypt the file data
  const encryptedData = encryptData(buffer, key, iv);

  // Store in IndexedDB
  const db = await openDatabase();
  return new Promise<any>((resolve, reject) => {
    const transaction = db.transaction([FILE_STORE], 'readwrite');
    const store = transaction.objectStore(FILE_STORE);

    const fileObject = {
      id: uniqueId,
      encryptedData,
      originalName: originalFilename || uniqueId,
      createdAt: new Date().toISOString()
    };

    const request = store.add(fileObject);

    request.onsuccess = () => {
      resolve({
        filePath: uniqueId,
        encryptionKey: key,
        encryptionIv: iv,
        size: fileBuffer.byteLength,
        originalName: originalFilename || uniqueId
      });
    };

    request.onerror = () => {
      reject(new Error('Failed to store file'));
    };
  });
}

/**
 * Retrieves and decrypts a file from IndexedDB
 * @param fileId Unique file ID
 * @param key Encryption key
 * @param iv Initialization vector
 * @returns Decrypted file data
 */
export async function getDecryptedFile(fileId: string, key: string, iv: string): Promise<ArrayBuffer> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FILE_STORE], 'readonly');
    const store = transaction.objectStore(FILE_STORE);
    const request = store.get(fileId);
    
    request.onsuccess = () => {
      if (!request.result) {
        reject(new Error('File not found'));
        return;
      }
      
      const { encryptedData } = request.result;
      
      // Decrypt the data
      try {
        const decryptedBuffer = decryptData(encryptedData, key, iv);
        resolve(decryptedBuffer.buffer);
      } catch (error) {
        reject(new Error('Failed to decrypt file'));
      }
    };
    
    request.onerror = () => {
      reject(new Error('Failed to retrieve file'));
    };
  });
}

/**
 * Deletes a file from storage
 * @param fileId Unique file ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FILE_STORE], 'readwrite');
    const store = transaction.objectStore(FILE_STORE);
    const request = store.delete(fileId);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Failed to delete file'));
    };
  });
}