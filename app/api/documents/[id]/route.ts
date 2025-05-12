'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  noStore();
  
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const documentId = params.id;
    
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
      // For downloads, we'll return the document with encryption keys
      // so the client can decrypt it from browser storage
      return NextResponse.json({
        document: {
          ...document,
          downloadMode: true
        }
      });
    }
    
    // Return document metadata without sensitive fields
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
  { params }: { params: { id: string } }
) {
  noStore();
  
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const documentId = params.id;
    
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
    
    // Delete document from database
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });
    
    return NextResponse.json({ 
      success: true,
      fileId: document.filePath // Return the file ID so client can delete from browser storage
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the document' },
      { status: 500 }
    );
  }
}