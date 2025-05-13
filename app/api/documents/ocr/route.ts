import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { getDecryptedFile } from '@/app/lib/fileStorage';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to process OCR on a document and update with OCR data
 * POST /api/documents/ocr
 */
export async function POST(request: NextRequest) {
  noStore();
  
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Parse the request body
    const body = await request.json();
    const { documentId, ocrData } = body;
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    // Get the document
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    });
    
    // Check if document exists and belongs to user
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    let extractedText = ocrData;

    // If ocrData is not provided, process the document for OCR
    if (!extractedText) {
      try {
        // Get the decrypted file
        const decryptedFile = await getDecryptedFile(
          document.filePath,
          document.encryptionKey || '',
          document.encryptionIv || ''
        );
        
        // Process document for OCR
        // This is a placeholder for actual OCR processing
        // In a real implementation, you would use a library like Tesseract.js
        extractedText = `Sample OCR text for document: ${document.name}. 
        This is a placeholder for actual OCR processing.`;
        
        // In a real implementation, you would do something like:
        // const { createWorker } = require('tesseract.js');
        // const worker = await createWorker();
        // await worker.loadLanguage('eng');
        // await worker.initialize('eng');
        // const { data: { text } } = await worker.recognize(decryptedFile);
        // extractedText = text;
        // await worker.terminate();
      } catch (error) {
        console.error('Error processing document for OCR:', error);
        return NextResponse.json(
          { error: 'Failed to process document for OCR' },
          { status: 500 }
        );
      }
    }
    
    // Update document with OCR data
    const updatedDocument = await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        ocr: true,
        ocrData: extractedText,
      },
    });
    
    // Return success with updated document (excluding encryption keys)
    const { encryptionKey, encryptionIv, ...safeDocument } = updatedDocument;
    return NextResponse.json({ document: safeDocument });
  } catch (error) {
    console.error('Error updating document with OCR data:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the document with OCR data' },
      { status: 500 }
    );
  }
}