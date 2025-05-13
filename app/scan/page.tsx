"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus2, Save, XCircle, Camera } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import DocumentScanner from '../components/scanner/DocumentScanner';
import { createPdfFromImages } from '../lib/pdfUtils';
import { saveScannedDocument } from '../actions/document';
import { encryptAndSaveToStorage } from '../lib/browserStorage';

interface ScannedDocument {
  originalImage: string;
  processedImage: string;
}

export default function ScanPage() {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documentName, setDocumentName] = useState('Scanned Document');
  const [error, setError] = useState<string | null>(null);

  // Handle the scanned documents to create a PDF
  const handleScannedDocuments = async (documents: ScannedDocument[]) => {
    if (!documents.length) return;
    
    try {
      setError(null);
      setIsGenerating(true);
      
      // Generate the PDF
      const pdfDataUrl = await createPdfFromImages(documents, 'archive-scan');
      setPdfUrl(pdfDataUrl);
    } catch (error) {
      console.error('Error creating PDF:', error);
      setError('There was an error creating the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle saving PDF to library
  const handleSavePdf = async () => {
    if (!pdfUrl) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Check authentication via the server action
      const result = await saveScannedDocument(pdfUrl, documentName);
      
      if (result.success) {
        // Create a Blob from the data URL directly
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch PDF data');
        }
        
        const pdfBlob = await response.blob();
        const file = new File([pdfBlob], `${documentName}.pdf`, { type: 'application/pdf' });
        
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ocr', 'false');
        
        // Upload directly to the API endpoint
        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload document to server');
        }
        
        const uploadData = await uploadResponse.json();
        
        // Save to browser storage with encryption
        try {
          // Convert Blob to ArrayBuffer for encryption
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          await encryptAndSaveToStorage(
            uploadData.document.filePath,
            uint8Array,
            uploadData.encryptionKey,
            uploadData.encryptionIv
          );
          
          // Navigate to the document view page
          router.push(`/documents/${uploadData.document.id}`);
        } catch (storageError) {
          console.error('Error saving to browser storage:', storageError);
          throw new Error('Failed to save document to browser storage');
        }
      } else {
        throw new Error('Failed to prepare document for upload');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      setError('There was an error saving your document. Please try again.');
      setIsSaving(false);
    }
  };

  // Reset to scan more documents
  const handleScanMore = () => {
    setPdfUrl(null);
    setError(null);
  };

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Document Scanner</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Use your camera to scan and digitize documents
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-md">
          {error}
          <button 
            className="ml-4 text-red-600 dark:text-red-400 underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {pdfUrl ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="mb-8">
            <div className="w-full aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
              <iframe 
                src={pdfUrl} 
                className="w-full h-full border-0" 
                title="Scanned Document"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="documentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Name
            </label>
            <input
              type="text"
              id="documentName"
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center"
              onClick={handleScanMore}
              disabled={isSaving}
            >
              <Camera className="h-5 w-5 mr-2" />
              Scan More
            </button>
            <button
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
              onClick={handleSavePdf}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="animate-pulse mr-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save to Library
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          {isGenerating ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center justify-center py-12">
              <FilePlus2 className="h-16 w-16 text-blue-600 animate-pulse mb-4" />
              <h2 className="text-xl font-semibold mb-2">Creating PDF...</h2>
              <p className="text-slate-500 dark:text-slate-400">
                Please wait while we generate your document
              </p>
            </div>
          ) : (
            <DocumentScanner onComplete={handleScannedDocuments} />
          )}
        </>
      )}
    </PageLayout>
  );
}