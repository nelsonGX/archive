'use client';

import { useState, useRef } from 'react';
import PageLayout from '../components/PageLayout';
import { useRouter } from 'next/navigation';
import { storeEncryptedFile } from '@/app/lib/browserStorage';

type FileWithPreview = {
  file: File;
  preview: string;
  progress: number;
  error?: string;
  id: string;
};

export default function UploadPage() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState('');
  const [runOcr, setRunOcr] = useState(true);
  const [encryptFile, setEncryptFile] = useState(true);
  const [backupToDrive, setBackupToDrive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles: FileWithPreview[] = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      id: crypto.randomUUID()
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input value so the same file can be selected again
    if (e.target.value) e.target.value = '';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles: FileWithPreview[] = Array.from(e.dataTransfer.files)
        .filter(file => {
          const type = file.type.toLowerCase();
          return type.includes('pdf') || type.includes('image/');
        })
        .map(file => ({
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          id: crypto.randomUUID()
        }));
        
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const removeFile = (id: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== id);
      // Revoke object URL for the removed file
      const removedFile = prev.find(f => f.id === id);
      if (removedFile) URL.revokeObjectURL(removedFile.preview);
      return updatedFiles;
    });
  };
  
  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;
    
    for (const fileData of files) {
      try {
        setFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { ...f, progress: 10, error: undefined } 
              : f
          )
        );
        
        // Step 1: Register the file with the server
        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('tags', tags);
        formData.append('ocr', runOcr.toString());
        formData.append('encrypt', encryptFile.toString());
        formData.append('backup', backupToDrive.toString());
        
        // Call the API to register the file
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }
        
        // Get the document and encryption details from the response
        const { document } = await response.json();
        
        setFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { ...f, progress: 30 } 
              : f
          )
        );
        
        // Step 2: Store the encrypted file in IndexedDB
        // Read the file as ArrayBuffer
        const fileBuffer = await fileData.file.arrayBuffer();
        
        // Upload progress at 60%
        setFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { ...f, progress: 60 } 
              : f
          )
        );
        
        // Encrypt and store the file
        await storeEncryptedFile(fileBuffer, fileData.file.name);
        
        // Set progress to 100% for completed upload
        setFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { ...f, progress: 100 } 
              : f
          )
        );
        
        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        
        setFiles(prev => 
          prev.map(f => 
            f.id === fileData.id 
              ? { ...f, error: error instanceof Error ? error.message : 'Upload failed' } 
              : f
          )
        );
      }
    }
    
    setIsUploading(false);
    
    // If all uploads were successful, redirect to home page after a short delay
    if (successCount === files.length) {
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    }
  };
  
  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Upload Documents</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Upload new documents to your personal archive
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Upload Files</h2>
          
          <div 
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium mb-2">
              Drag and drop your files here
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              or click to browse files from your computer
            </p>
            
            <label htmlFor="file-upload" className="inline-block">
              <span className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors cursor-pointer">
                Select Files
              </span>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                multiple 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={handleFileSelect}
                ref={fileInputRef}
              />
            </label>
            
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Supported formats: PDF, JPG, PNG
            </p>
          </div>
          
          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Selected Files ({files.length})</h3>
              
              <div className="space-y-3">
                {files.map(fileData => (
                  <div key={fileData.id} className="flex items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                    <div className="w-10 h-10 mr-3 flex-shrink-0">
                      {fileData.file.type.includes('pdf') ? (
                        <div className="w-full h-full flex items-center justify-center bg-red-100 dark:bg-red-900 rounded">
                          <span className="text-xs font-medium text-red-700 dark:text-red-300">PDF</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-cover bg-center rounded" style={{ backgroundImage: `url(${fileData.preview})` }}></div>
                      )}
                    </div>
                    
                    <div className="flex-grow mr-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate max-w-xs">{fileData.file.name}</span>
                        <span className="text-xs text-slate-500">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      
                      {isUploading && (
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${fileData.error ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${fileData.progress}%` }}
                          ></div>
                        </div>
                      )}
                      
                      {fileData.error && (
                        <p className="text-xs text-red-500 mt-1">{fileData.error}</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => removeFile(fileData.id)}
                      className="p-1 text-slate-500 hover:text-red-500"
                      disabled={isUploading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Upload Settings</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-1">
                Tags (comma separated)
              </label>
              <input 
                id="tags" 
                type="text" 
                placeholder="e.g. important, tax, 2023" 
                className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center">
              <input 
                id="run-ocr" 
                type="checkbox" 
                className="h-4 w-4 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
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
                className="h-4 w-4 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
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
                className="h-4 w-4 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
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
        
        <div className="flex justify-end space-x-4">
          <button 
            className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={() => router.push('/')}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-blue-400"
            onClick={uploadFiles}
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}