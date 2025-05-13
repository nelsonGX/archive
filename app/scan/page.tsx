"use client"

import PageLayout from '../components/PageLayout';
import DocumentScanner from '../components/scanner/DocumentScanner';

interface ScannedDocument {
  originalImage: string;
  processedImage: string;
}

export default function ScanPage() {
  // This would typically be a server action to handle the scanned documents
  const handleScannedDocuments = (documents: ScannedDocument[]) => {
    // In a real implementation, you would save these documents
    // to the database and redirect the user to view them
    console.log('Scanned documents:', documents);
    
    // For now, we'll just redirect back to the home page
    // redirect('/documents');
  };

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Document Scanner</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Use your camera to scan and digitize documents
        </p>
      </div>

      <DocumentScanner onComplete={handleScannedDocuments} />
    </PageLayout>
  );
}