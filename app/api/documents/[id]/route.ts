'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';
import { getDecryptedFile } from '@/app/lib/fileStorage';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  noStore();

  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // Get document ID directly from context.params
    const documentId = context.params.id;
    
    // Get the document
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      include: {
        tags: true,
      },
    });
    
    // Check if document exists and belongs to user
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Check if download parameter is set
    const searchParams = request.nextUrl.searchParams;
    const download = searchParams.get('download') === 'true';
    
    if (download) {
      try {
        // Get and decrypt the file from server storage
        const decryptedFile = await getDecryptedFile(
          document.filePath,
          document.encryptionKey || '',
          document.encryptionIv || ''
        );
        
        // Set headers for file download
        const headers = new Headers();
        headers.set('Content-Disposition', `attachment; filename="${document.name}"`);
        headers.set('Content-Type', document.fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream');
        headers.set('Content-Length', decryptedFile.length.toString());
        
        // Return the file as a downloadable response
        return new NextResponse(decryptedFile, {
          status: 200,
          headers
        });
      } catch (error) {
        console.error('Error downloading file:', error);
        return NextResponse.json(
          { error: 'An error occurred while downloading the file' },
          { status: 500 }
        );
      }
    }
    
    // For normal viewing, return document metadata without sensitive fields
    const { encryptionKey, encryptionIv, ...safeDocument } = document;
    return NextResponse.json({ document: safeDocument });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  noStore();

  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // Get document ID directly from context.params
    const documentId = context.params.id;
    
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
    
    // Delete document from server storage
    const { deleteFile } = await import('@/app/lib/fileStorage');
    await deleteFile(document.filePath);
    
    // Delete document from database
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });
    
    return NextResponse.json({ 
      success: true
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the document' },
      { status: 500 }
    );
  }
}