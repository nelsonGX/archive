'use client';

import CryptoJS from 'crypto-js';

/**
 * Generates a random encryption key and initialization vector
 */
export function generateEncryptionKey() {
  const key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  const iv = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
  return { key, iv };
}

/**
 * Encrypts file data using AES-256 encryption
 * @param data File data as Buffer, Uint8Array or string
 * @param key Encryption key
 * @param iv Initialization vector
 * @returns Encrypted data as string
 */
export function encryptData(data: Buffer | Uint8Array | string, key: string, iv: string): string {
  // Convert Buffer or Uint8Array to WordArray if needed
  const wordArray = typeof data === 'string' 
    ? CryptoJS.enc.Utf8.parse(data)
    : CryptoJS.lib.WordArray.create(
        // @ts-ignore - Buffer/Uint8Array type conversion
        data as any, 
        data.length || (data as Uint8Array).byteLength
      );

  // Encrypt using AES
  const encrypted = CryptoJS.AES.encrypt(
    wordArray,
    CryptoJS.enc.Hex.parse(key),
    {
      iv: CryptoJS.enc.Hex.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    }
  );

  return encrypted.toString();
}

/**
 * Decrypts encrypted data
 * @param encryptedData Encrypted data as string
 * @param key Encryption key
 * @param iv Initialization vector
 * @returns Decrypted data as Uint8Array
 */
export function decryptData(encryptedData: string, key: string, iv: string): Uint8Array {
  // Decrypt using AES
  const decrypted = CryptoJS.AES.decrypt(
    encryptedData,
    CryptoJS.enc.Hex.parse(key),
    {
      iv: CryptoJS.enc.Hex.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    }
  );

  // Convert WordArray to Uint8Array
  const wordArray = decrypted.words;
  const length = decrypted.sigBytes;
  const buffer = new Uint8Array(length);

  for (let i = 0; i < length; i += 4) {
    const value = wordArray[i / 4];
    if (value !== undefined) {
      buffer[i] = (value >> 24) & 0xff;
      if (i + 1 < length) {
        buffer[i + 1] = (value >> 16) & 0xff;
      }
      if (i + 2 < length) {
        buffer[i + 2] = (value >> 8) & 0xff;
      }
      if (i + 3 < length) {
        buffer[i + 3] = value & 0xff;
      }
    }
  }

  return buffer;
}