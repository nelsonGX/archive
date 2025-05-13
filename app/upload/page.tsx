'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropProvider, DropZone } from './DragDropContext';
import dynamic from 'next/dynamic';

// Import OCR module dynamically with no SSR to avoid server-side errors
const processDocumentOcr = async (documentId) => {
  if (typeof window !== 'undefined') {
    try {
      const module = await import('@/app/lib/ocr');
      console.log("OCR module loaded");
      const result = await module.processDocumentOcr(documentId);
      console.log("OCR processing completed");
      return result;
    } catch (error) {
      console.error("OCR processing error:", error);
      return ''; // Return empty string in case of error
    }
  }
  console.log("Not in browser environment, skipping OCR");
  return '';
};

// Basic layout component
const SimpleLayout = ({ children }) => (
  <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-xl font-bold">Archive</h1>
      </div>
    </header>
    <main className="container mx-auto p-4 mt-4">
      {children}
    </main>
  </div>
);

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState('');
  const [runOcr, setRunOcr] = useState(true);
  const [encryptFile, setEncryptFile] = useState(true);
  const [backupToDrive, setBackupToDrive] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();
  
  const handleFileSelect = (e) => {
    console.log("File selection triggered");
    
    if (!e.target.files || e.target.files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    console.log("Files selected:", e.target.files.length);
    
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      id: Math.random().toString(36).substring(2, 10)
    }));
    
    console.log("Processed files:", newFiles.length);
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input value so the same file can be selected again
    if (e.target.value) e.target.value = '';
  };
  
  const openFileDialog = () => {
    if (fileInputRef.current) {
      console.log("Clicking file input");
      fileInputRef.current.click();
    }
  };
  
  const handleFilesDropped = (droppedFiles) => {
    console.log("Files dropped:", droppedFiles.length);
    
    const newFiles = droppedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      id: Math.random().toString(36).substring(2, 10)
    }));
    
    console.log("Processed dropped files:", newFiles.length);
    setFiles(prev => [...prev, ...newFiles]);
  };
  
  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    const updatedFiles = [...files];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];

      try {
        // Update progress
        updatedFiles[i] = { ...fileData, progress: 20, error: undefined };
        setFiles([...updatedFiles]);

        // Prepare formData with file and metadata
        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('tags', tags);
        formData.append('ocr', runOcr.toString());
        formData.append('encrypt', encryptFile.toString());
        formData.append('backup', backupToDrive.toString());

        // Upload the file directly to the server
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        // Get the document details from the response
        const { document, success } = await response.json();
        
        updatedFiles[i] = { ...updatedFiles[i], progress: 70 };
        setFiles([...updatedFiles]);

        // If OCR is enabled, process the document
        if (runOcr) {
          updatedFiles[i] = { ...updatedFiles[i], progress: 80 };
          setFiles([...updatedFiles]);

          try {
            // Process OCR on the document
            const ocrText = await processDocumentOcr(document.id);

            // Save OCR data to the server
            if (ocrText) {
              await fetch('/api/documents/ocr', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  documentId: document.id,
                  ocrData: ocrText,
                }),
              });
            }
          } catch (ocrError) {
            console.error('OCR processing error:', ocrError);
            // OCR failed, but we'll consider the upload successful
          }
        }

        // If backup to Google Drive is enabled, request backup
        if (backupToDrive) {
          updatedFiles[i] = { ...updatedFiles[i], progress: 90 };
          setFiles([...updatedFiles]);

          try {
            await fetch('/api/documents/backup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                documentId: document.id,
              }),
            });
          } catch (backupError) {
            console.error('Google Drive backup error:', backupError);
            // Backup failed, but we'll consider the upload successful
          }
        }

        // Update progress to 100% for completed upload
        updatedFiles[i] = { ...updatedFiles[i], progress: 100 };
        setFiles([...updatedFiles]);

        successCount++;
      } catch (error) {
        console.error('Upload error:', error);

        updatedFiles[i] = {
          ...updatedFiles[i],
          error: error instanceof Error ? error.message : 'Upload failed',
          progress: 0
        };
        setFiles([...updatedFiles]);
      }
    }

    setIsUploading(false);

    // Show completion message
    if (successCount === files.length) {
      alert(`Successfully uploaded ${successCount} file(s).`);

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } else if (successCount > 0) {
      alert(`Uploaded ${successCount} out of ${files.length} files. Some files had errors.`);
    } else {
      alert('Upload failed. Please try again.');
    }
  };
  
  return (
    <DragDropProvider>
      <SimpleLayout>
        <div className="bg-white dark:bg-zinc-800 rounded shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Upload Files</h2>
          
          <DropZone
            onFiles={handleFilesDropped}
            className={`
              border-2 border-dashed
              rounded-lg p-8 text-center cursor-pointer
              hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
            `}
          >
            {(isOver) => (
              <>
                <div className="mb-4" onClick={openFileDialog}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <p className="mb-2 font-medium text-lg" onClick={openFileDialog}>
                  {isOver ? 'Drop files here' : 'Click to browse files'}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400" onClick={openFileDialog}>
                  {isOver ? 'Release to upload' : 'or drag and drop files here'}
                </p>
                
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept=".pdf,.jpg,.jpeg,.png" 
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
              </>
            )}
          </DropZone>

          {/* Upload settings */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Upload Settings</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-1">
                  Tags (comma separated)
                </label>
                <input
                  id="tags"
                  type="text"
                  placeholder="e.g. important, tax, 2023"
                  className="w-full py-2 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-900"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="run-ocr"
                    type="checkbox"
                    className="h-4 w-4 border-zinc-300 rounded text-blue-600 focus:ring-blue-500"
                    checked={runOcr}
                    onChange={(e) => setRunOcr(e.target.checked)}
                    disabled={isUploading}
                  />
                  <label htmlFor="run-ocr" className="ml-2 text-sm">
                    Run OCR (extract text from document)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="encrypt-file"
                    type="checkbox"
                    className="h-4 w-4 border-zinc-300 rounded text-blue-600 focus:ring-blue-500"
                    checked={encryptFile}
                    onChange={(e) => setEncryptFile(e.target.checked)}
                    disabled={isUploading}
                  />
                  <label htmlFor="encrypt-file" className="ml-2 text-sm">
                    Encrypt file
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="backup-drive"
                    type="checkbox"
                    className="h-4 w-4 border-zinc-300 rounded text-blue-600 focus:ring-blue-500"
                    checked={backupToDrive}
                    onChange={(e) => setBackupToDrive(e.target.checked)}
                    disabled={isUploading}
                  />
                  <label htmlFor="backup-drive" className="ml-2 text-sm">
                    Backup to Google Drive
                  </label>
                </div>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Selected Files ({files.length})</h3>
              <div className="space-y-3">
                {files.map(fileData => (
                  <div key={fileData.id} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded flex justify-between items-center">
                    <div className="flex-grow mr-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate max-w-xs">{fileData.name}</span>
                        <span className="text-sm text-zinc-500 ml-2">
                          {(fileData.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>

                      {(isUploading || fileData.progress > 0) && (
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${fileData.error ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${fileData.progress || 0}%` }}
                          ></div>
                        </div>
                      )}

                      {fileData.error && (
                        <p className="text-xs text-red-500 mt-1">{fileData.error}</p>
                      )}
                    </div>

                    <button
                      onClick={() => setFiles(files.filter(f => f.id !== fileData.id))}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={isUploading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end gap-3">
            <button 
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded"
              onClick={() => router.push('/')}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-400"
              onClick={uploadFiles}
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      </SimpleLayout>
    </DragDropProvider>
  );
}