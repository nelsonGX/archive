import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to update a document with OCR data
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
    const { documentId, ocrData } = await request.json();
    
    if (!documentId || !ocrData) {
      return NextResponse.json({ error: 'Document ID and OCR data are required' }, { status: 400 });
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
    
    // Update document with OCR data
    const updatedDocument = await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        ocr: true,
        ocrData: ocrData,
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