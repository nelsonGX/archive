'use client';

import { useState, useEffect } from 'react';
import PdfViewer from './PdfViewer';
import PdfEmbedViewer from './PdfEmbedViewer';
import SimplePdfViewer from './SimplePdfViewer';

interface DocumentPreviewProps {
  document: any; // Document metadata from API
  height?: number;
}

export default function DocumentPreview({ document, height = 600 }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentWithKeys, setDocumentWithKeys] = useState<any>(null);

  useEffect(() => {
    async function fetchDocumentWithKeys() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch document with encryption keys
        const response = await fetch(`/api/documents/${document.id}?download=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch document keys for preview');
        }
        
        const data = await response.json();
        setDocumentWithKeys(data.document);
      } catch (err) {
        console.error('Error fetching document keys:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document preview');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocumentWithKeys();
  }, [document.id]);

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p>Loading document preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-lg text-center">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!documentWithKeys) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-4 max-w-lg text-center">
          <p>Could not load document preview</p>
        </div>
      </div>
    );
  }

  // For PDF files, use PDF Viewer
  if (documentWithKeys.fileType === 'pdf') {
    // Use SimplePdfViewer which offers both inline and download options
    return (
      <SimplePdfViewer
        fileId={documentWithKeys.filePath}
        encryptionKey={documentWithKeys.encryptionKey}
        encryptionIv={documentWithKeys.encryptionIv}
        documentName={documentWithKeys.name}
        height={height}
      />
    );
  }

  // For other file types, show a generic preview
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
      <img src={`/${documentWithKeys.fileType}.svg`} alt="Document" className="w-24 h-24 mx-auto mb-4" onError={(e) => { e.currentTarget.src = "/file.svg" }} />
      <p className="text-lg font-medium mb-2">Preview not available</p>
      <p className="text-slate-500 dark:text-slate-400 mb-4 text-center max-w-md">
        This file type doesn't have a preview. You can download the file to view its contents.
      </p>
    </div>
  );
}