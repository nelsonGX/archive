'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';
import { decryptData } from '@/app/lib/serverEncryption';
import { unstable_noStore as noStore } from 'next/cache';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  noStore();

  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get document ID from query
    const documentId = request.nextUrl.searchParams.get('id');
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
    
    // Get file path
    const fullPath = path.join(process.cwd(), 'public', ...document.filePath.split('/').filter(Boolean));
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read encrypted file
    const encryptedBuffer = fs.readFileSync(fullPath);
    
    // Decrypt file
    const decryptedBuffer = decryptData(
      encryptedBuffer.toString('base64'),
      document.encryptionKey!,
      document.encryptionIv!
    );
    
    // Create response with appropriate headers
    const response = new NextResponse(decryptedBuffer);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${document.name}.pdf"`);
    
    return response;
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'An error occurred while downloading the document' },
      { status: 500 }
    );
  }
}