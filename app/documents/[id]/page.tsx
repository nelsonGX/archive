'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageLayout from '@/app/components/PageLayout';
import DocumentPreview from '@/app/components/document/DocumentPreview';
import { processDocumentOcr } from '@/app/lib/ocr';

export default function DocumentViewer() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id;

        // Fetch document metadata
        const response = await fetch(`/api/documents/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }

        const { document } = await response.json();
        setDocument(document);

        // If OCR data exists, set it
        if (document.ocr && document.ocrData) {
          setOcrText(document.ocrData);
        }

      } catch (error) {
        console.error('Error fetching document:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [params.id]);

  const handleDownload = async () => {
    try {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      
      // Fetch document with encryption keys for download
      const response = await fetch(`/api/documents/${id}?download=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch document for download');
      }
      
      const { document } = await response.json();
      
      // In a real implementation, we would retrieve the encrypted file from IndexedDB,
      // decrypt it using the keys, and create a download link
      // For this demo, we'll simulate the download

      // Create a simple text file for demonstration
      const blob = new Blob(['This is a simulated document download'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create a hidden download link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name || 'document.txt';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      setError(error instanceof Error ? error.message : 'Download failed');
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;

      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      router.push('/');

    } catch (error) {
      console.error('Error deleting document:', error);
      setError(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleProcessOcr = async () => {
    if (!document) return;

    try {
      setIsProcessingOcr(true);

      // Fetch document with encryption keys to process OCR
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      const response = await fetch(`/api/documents/${id}?download=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch document for OCR processing');
      }

      const { document: docWithKeys } = await response.json();

      // Process document for OCR
      const extractedText = await processDocumentOcr(
        docWithKeys.filePath,
        docWithKeys.encryptionKey,
        docWithKeys.encryptionIv
      );

      // Update document with OCR data
      const updateResponse = await fetch('/api/documents/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: id,
          ocrData: extractedText,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update document with OCR data');
      }

      const { document: updatedDoc } = await updateResponse.json();
      setDocument(updatedDoc);
      setOcrText(updatedDoc.ocrData);

    } catch (error) {
      console.error('Error processing OCR:', error);
      setError(error instanceof Error ? error.message : 'OCR processing failed');
    } finally {
      setIsProcessingOcr(false);
    }
  };
  
  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading document...</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (error) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-lg text-center">
            <p>{error}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </PageLayout>
    );
  }
  
  if (!document) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-4 max-w-lg text-center">
            <p>Document not found</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">{document.name}</h1>
          <p className="text-slate-500">
            {new Date(document.createdAt).toLocaleDateString()} • {(document.size / 1024 / 1024).toFixed(2)} MB
            {document.ocr && <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">OCR processed</span>}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDownload}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          {!document.ocr && (
            <button
              onClick={handleProcessOcr}
              disabled={isProcessingOcr}
              className={`bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center ${isProcessingOcr ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessingOcr ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Process OCR
                </>
              )}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {/* Document preview */}
            {document && <DocumentPreview document={document} height={500} />}

            {document.tags && document.tags.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 px-3 py-1 rounded-full text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* OCR Text Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">OCR Text</h2>
              {!document.ocr && !isProcessingOcr && (
                <button
                  onClick={handleProcessOcr}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Extract text with OCR
                </button>
              )}
            </div>

            {isProcessingOcr ? (
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 min-h-[50vh] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Processing document with OCR...</p>
                  <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
                </div>
              </div>
            ) : ocrText ? (
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 min-h-[50vh] overflow-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {ocrText}
                </pre>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 min-h-[50vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">No OCR data available</p>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Click the "Process OCR" button to extract text from this document.
                    This will allow you to search the document's content later.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}