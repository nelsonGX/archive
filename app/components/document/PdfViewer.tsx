'use client';

import { useState, useEffect, useRef } from 'react';
import { getDecryptedFile } from '@/app/lib/browserStorage';

interface PdfViewerProps {
  fileId: string;
  encryptionKey: string;
  encryptionIv: string;
  width?: number;
  height?: number;
}

export default function PdfViewer({
  fileId,
  encryptionKey,
  encryptionIv,
  width = 800,
  height = 600
}: PdfViewerProps) {
  const [pdfJs, setPdfJs] = useState<any>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load PDF.js library
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPdfJs = async () => {
      try {
        // Dynamically import the library
        const pdfJsModule = await import('pdfjs-dist');
        
        // Set the worker source to a CDN version that matches our package
        pdfJsModule.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.2.133/pdf.worker.min.js';
        
        setPdfJs(pdfJsModule);
      } catch (err) {
        console.error('Error loading PDF.js:', err);
        setError('Failed to load PDF viewer library');
      }
    };

    loadPdfJs();
  }, []);

  // Load the PDF document once PDF.js is available
  useEffect(() => {
    if (!pdfJs || !fileId || !encryptionKey || !encryptionIv) return;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the decrypted file from browser storage
        const fileData = await getDecryptedFile(fileId, encryptionKey, encryptionIv);
        
        // Load the PDF document
        const loadingTask = pdfJs.getDocument({ data: fileData });
        const pdf = await loadingTask.promise;
        
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [pdfJs, fileId, encryptionKey, encryptionIv]);

  // Render the current page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Get the page
        const page = await pdfDocument.getPage(currentPage);
        
        // Calculate scale to fit width if needed
        const viewport = page.getViewport({ scale });
        
        // Set canvas dimensions
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
        setError(err instanceof Error ? err.message : 'Failed to render page');
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale]);

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Zoom in
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  // Zoom out
  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  // Reset zoom
  const resetZoom = () => {
    setScale(1.0);
  };

  if (isLoading || !pdfJs) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-zinc-100 dark:bg-zinc-700 rounded-lg">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p>Loading PDF viewer...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-zinc-100 dark:bg-zinc-700 rounded-lg">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-lg text-center">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!pdfDocument) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-zinc-100 dark:bg-zinc-700 rounded-lg">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="bg-zinc-200 dark:bg-zinc-600 p-2 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className={`p-1 rounded ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-300 dark:hover:bg-zinc-500'}`}
            aria-label="Previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span>
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className={`p-1 rounded ${currentPage >= numPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-300 dark:hover:bg-zinc-500'}`}
            aria-label="Next page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-500"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-500"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={resetZoom}
            className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-500 text-xs"
            aria-label="Reset zoom"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="overflow-auto bg-zinc-100 dark:bg-zinc-700 rounded-b-lg p-2 flex justify-center" style={{ maxHeight: `${height}px` }}>
        <canvas ref={canvasRef} className="shadow-lg" />
      </div>
    </div>
  );
}