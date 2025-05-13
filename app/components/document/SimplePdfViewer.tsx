'use client';

import { useState, useEffect } from 'react';
import { getDecryptedFile } from '@/app/lib/browserStorage';

interface SimplePdfViewerProps {
  fileId: string;
  encryptionKey: string;
  encryptionIv: string;
  height?: number;
  documentName: string;
  isServerStored?: boolean;
}

export default function SimplePdfViewer({
  fileId,
  encryptionKey,
  encryptionIv,
  documentName,
  height = 600,
  isServerStored = false
}: SimplePdfViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'inline' | 'download'>('inline');

  useEffect(() => {
    const loadPdf = async () => {
      if (viewMode !== 'inline') return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Get the file data - either from server or browser storage
        let fileData;
        if (isServerStored) {
          // Get the file directly from the server's document download endpoint
          const documentId = fileId.split('/').pop()?.split('.')[0] || '';
          const response = await fetch(`/api/documents/download?id=${documentId}`);
          if (!response.ok) throw new Error('Failed to fetch document from server');
          fileData = await response.arrayBuffer();
        } else {
          // Get the decrypted file from browser storage
          fileData = await getDecryptedFile(fileId, encryptionKey, encryptionIv);
        }
        
        // Create a blob from the decrypted data
        const blob = new Blob([fileData], { type: 'application/pdf' });
        
        // Create an object URL from the blob
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        // If there's an error, fall back to download mode
        setViewMode('download');
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
  }, [fileId, encryptionKey, encryptionIv, viewMode]);

  const handleDownload = async () => {
    try {
      // Get the file data - either from server or browser storage
      let fileData;
      if (isServerStored) {
        // Get the file directly from the server's document download endpoint
        const documentId = fileId.split('/').pop()?.split('_')[0] || '';
        const response = await fetch(`/api/documents/download?id=${documentId}`);
        if (!response.ok) throw new Error('Failed to fetch document from server');
        fileData = await response.arrayBuffer();
      } else {
        // Get the decrypted file from browser storage
        fileData = await getDecryptedFile(fileId, encryptionKey, encryptionIv);
      }
      
      // Create a blob from the decrypted data
      const blob = new Blob([fileData], { type: 'application/pdf' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'inline' ? 'download' : 'inline');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-slate-100 dark:bg-slate-700 rounded-lg">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  if (error && viewMode === 'inline') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-slate-100 dark:bg-slate-700 rounded-lg">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-lg text-center">
          <p>{error}</p>
        </div>
        <button
          onClick={toggleViewMode}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try download instead
        </button>
      </div>
    );
  }

  if (viewMode === 'download') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[400px] bg-slate-100 dark:bg-slate-700 rounded-lg">
        <img src="/file.svg" alt="PDF Document" className="w-24 h-24 mb-4" />
        <h3 className="text-xl font-semibold mb-2">{documentName || 'Document'}</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
          This document can be viewed by downloading it to your device.
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button 
            onClick={toggleViewMode}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 dark:hover:bg-slate-600"
          >
            Try viewing online
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg">
      {objectUrl ? (
        <>
          <div className="bg-slate-200 dark:bg-slate-600 p-2 flex justify-between items-center">
            <h3 className="font-medium truncate">{documentName || 'Document'}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={toggleViewMode}
                className="text-slate-600 hover:text-slate-800 text-sm"
              >
                View options
              </button>
            </div>
          </div>
          <embed 
            src={objectUrl} 
            type="application/pdf" 
            className="w-full" 
            style={{ height: `${height}px` }}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-slate-100 dark:bg-slate-700">
          <p>Unable to load document preview.</p>
          <button
            onClick={toggleViewMode}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try download instead
          </button>
        </div>
      )}
    </div>
  );
}