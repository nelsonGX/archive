import crypto from 'crypto';

/**
 * Generates a random encryption key and initialization vector
 * Server-side implementation using Node.js crypto
 */
export function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  const iv = crypto.randomBytes(16).toString('hex');
  return { key, iv };
}

/**
 * Encrypts data using AES-256 encryption (server-side)
 * @param data Data to encrypt as Buffer or string
 * @param key Encryption key
 * @param iv Initialization vector
 * @returns Encrypted data as string
 */
export function encryptData(data: Buffer | string, key: string, iv: string): string {
  // Convert hex key and iv to buffers
  const keyBuffer = Buffer.from(key, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  
  // Encrypt data
  let encrypted: Buffer;
  if (typeof data === 'string') {
    encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  } else {
    encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  }
  
  return encrypted.toString('base64');
}

/**
 * Decrypts encrypted data (server-side)
 * @param encryptedData Encrypted data as string
 * @param key Encryption key
 * @param iv Initialization vector
 * @returns Decrypted data as Buffer
 */
export function decryptData(encryptedData: string, key: string, iv: string): Buffer {
  // Convert hex key and iv to buffers
  const keyBuffer = Buffer.from(key, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  
  // Decrypt data
  const encryptedBuffer = Buffer.from(encryptedData, 'base64');
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}