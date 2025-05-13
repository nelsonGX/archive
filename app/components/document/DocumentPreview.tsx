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

  if (isLoading) {
    // Set loading to false since we're no longer fetching document keys
    setIsLoading(false);
  }

  // For PDF files, use PDF Viewer
  if (document.fileType === 'pdf') {
    return (
      <SimplePdfViewer
        documentId={document.id}
        documentName={document.name}
        height={height}
        isServerStored={true}
      />
    );
  }

  // For other file types, show a generic preview
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-700 rounded-lg">
      <img src={`/${document.fileType}.svg`} alt="Document" className="w-24 h-24 mx-auto mb-4" onError={(e) => { e.currentTarget.src = "/file.svg" }} />
      <p className="text-lg font-medium mb-2">Preview not available</p>
      <p className="text-zinc-500 dark:text-zinc-400 mb-4 text-center max-w-md">
        This file type doesn't have a preview. You can download the file to view its contents.
      </p>
    </div>
  );
}