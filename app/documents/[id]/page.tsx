'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageLayout from '@/app/components/PageLayout';
import { getDecryptedFile } from '@/app/lib/browserStorage';

export default function DocumentViewer() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
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
        
        // Get document content from browser storage
        // Note: In a real app, we'd need to fetch the encryption keys and use them
        // For demo purposes, we're just setting a placeholder URL
        setFileUrl('/file.svg');
        
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
          <button
            onClick={handleDelete}
            className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        {/* Document preview placeholder */}
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
          <div className="text-center p-8">
            <img src={fileUrl || '/file.svg'} alt="Document" className="w-24 h-24 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Preview not available</p>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              This is a placeholder for document preview. In a complete implementation, 
              this would show the actual document content.
            </p>
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Download to view
            </button>
          </div>
        </div>
        
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
    </PageLayout>
  );
}