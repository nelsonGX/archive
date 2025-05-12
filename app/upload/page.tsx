import PageLayout from '../components/PageLayout';
import Image from 'next/image';
import { useState } from 'react';

export default function UploadPage() {
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
          
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
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
              <input id="file-upload" type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" />
            </label>
            
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Supported formats: PDF, JPG, PNG
            </p>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Upload Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category
              </label>
              <select 
                id="category" 
                className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900"
              >
                <option value="">Select a category</option>
                <option value="receipts">Receipts</option>
                <option value="contracts">Contracts</option>
                <option value="bills">Bills</option>
                <option value="taxes">Taxes</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-1">
                Tags (comma separated)
              </label>
              <input 
                id="tags" 
                type="text" 
                placeholder="e.g. important, tax, 2023" 
                className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center">
              <input 
                id="run-ocr" 
                type="checkbox" 
                className="h-4 w-4 border-slate-300 rounded text-blue-600 focus:ring-blue-500"
                defaultChecked 
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
                defaultChecked
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
              />
              <label htmlFor="backup-drive" className="ml-2 text-sm">
                Backup to Google Drive
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
            Upload Files
          </button>
        </div>
      </div>
    </PageLayout>
  );
}