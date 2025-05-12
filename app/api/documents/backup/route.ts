import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';
import { backupDocumentToDrive } from '@/app/lib/googleDrive';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to backup a document to Google Drive
 * POST /api/documents/backup
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
    const { documentId } = await request.json();
    
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
    
    // Backup to Google Drive
    const success = await backupDocumentToDrive(documentId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to backup to Google Drive' }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error backing up document:', error);
    return NextResponse.json(
      { error: 'An error occurred while backing up the document' },
      { status: 500 }
    );
  }
}