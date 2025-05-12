'use client';

import { useState, useCallback } from 'react';
import { storeEncryptedFile } from '@/app/lib/browserStorage';

interface BrowserStorageUploaderProps {
  file: File;
  documentId: string;
  encryptionKey: string;
  encryptionIv: string;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export default function BrowserStorageUploader({
  file,
  documentId,
  encryptionKey,
  encryptionIv,
  onComplete,
  onError
}: BrowserStorageUploaderProps) {
  const [progress, setProgress] = useState(0);
  
  const uploadToStorage = useCallback(async () => {
    try {
      setProgress(10);
      
      // Read the file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      setProgress(30);
      
      // Encrypt and store the file in IndexedDB
      await storeEncryptedFile(fileBuffer, file.name);
      
      setProgress(100);
      onComplete();
    } catch (error) {
      console.error('Error storing file in browser:', error);
      onError(error instanceof Error ? error : new Error('Failed to store file'));
    }
  }, [file, documentId, encryptionKey, encryptionIv, onComplete, onError]);
  
  // Start upload when component mounts
  useState(() => {
    uploadToStorage();
  });
  
  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
      <div 
        className="h-1.5 rounded-full bg-blue-500"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}