'use client';

import { useState, useEffect } from 'react';

interface SimplePdfViewerProps {
  fileId?: string;
  encryptionKey?: string;
  encryptionIv?: string;
  documentId: string;
  height?: number;
  documentName: string;
  isServerStored?: boolean;
}

export default function SimplePdfViewer({
  fileId,
  encryptionKey,
  encryptionIv,
  documentId,
  documentName,
  height = 600,
  isServerStored = true
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

        // For server-stored files, fetch directly from the API
        const response = await fetch(`/api/documents/${documentId}?download=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch document for preview');
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        
        // If it's a PDF, create a blob URL from it
        if (contentType && contentType.includes('application/pdf')) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setObjectUrl(url);
        } else {
          // Not a PDF, handle accordingly
          console.error('Response is not a PDF:', contentType);
          throw new Error('Document is not a PDF or could not be loaded');
        }
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
  }, [documentId, viewMode]);

  const handleDownload = async () => {
    try {
      // Direct file download by opening in a new tab
      window.open(`/api/documents/${documentId}?download=true`, '_blank');
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
      <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-zinc-100 dark:bg-zinc-700 rounded-lg">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  if (error && viewMode === 'inline') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-zinc-100 dark:bg-zinc-700 rounded-lg">
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
      <div className="flex flex-col items-center justify-center w-full min-h-[400px] bg-zinc-100 dark:bg-zinc-700 rounded-lg">
        <img src="/file.svg" alt="PDF Document" className="w-24 h-24 mb-4" />
        <h3 className="text-xl font-semibold mb-2">{documentName || 'Document'}</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-md">
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
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 dark:hover:bg-zinc-600"
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
          <div className="bg-zinc-200 dark:bg-zinc-600 p-2 flex justify-between items-center">
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
                className="text-zinc-600 hover:text-zinc-800 text-sm"
              >
                View options
              </button>
            </div>
          </div>
          <iframe 
            src={objectUrl} 
            className="w-full border-none" 
            style={{ height: `${height}px` }}
            title={documentName}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-zinc-100 dark:bg-zinc-700">
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