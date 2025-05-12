'use client';

import { useState, useEffect } from 'react';
import { getDecryptedFile } from '@/app/lib/browserStorage';

interface PdfEmbedViewerProps {
  fileId: string;
  encryptionKey: string;
  encryptionIv: string;
  height?: number;
}

export default function PdfEmbedViewer({
  fileId,
  encryptionKey,
  encryptionIv,
  height = 600
}: PdfEmbedViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the decrypted file from browser storage
        const fileData = await getDecryptedFile(fileId, encryptionKey, encryptionIv);
        
        // Create a blob from the decrypted data
        const blob = new Blob([fileData], { type: 'application/pdf' });
        
        // Create an object URL from the blob
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();

    // Clean up the object URL when the component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId, encryptionKey, encryptionIv]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-slate-100 dark:bg-slate-700 rounded-lg">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-slate-100 dark:bg-slate-700 rounded-lg">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-lg text-center">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg">
      {objectUrl ? (
        <object
          data={objectUrl}
          type="application/pdf"
          className="w-full bg-white"
          style={{ height: `${height}px` }}
        >
          <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-slate-100 dark:bg-slate-700">
            <p>Your browser doesn't support embedded PDF viewing.</p>
            <a
              href={objectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Open PDF in new tab
            </a>
          </div>
        </object>
      ) : (
        <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-slate-100 dark:bg-slate-700">
          <p>Unable to load document preview.</p>
        </div>
      )}
    </div>
  );
}