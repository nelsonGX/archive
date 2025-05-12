'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';
import { generateEncryptionKey } from '@/app/lib/encryption';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  noStore();
  
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tags = formData.get('tags') as string | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate a unique file ID and encryption keys
    const uniqueFileId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const { key, iv } = generateEncryptionKey();
    
    // Get file info
    const size = file.size;
    const originalName = file.name;
    const fileType = file.type.split('/')[1] || 'pdf';

    // Parse tags if present
    const tagList = tags ? tags.split(',').map(tag => tag.trim()) : [];

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        name: originalName,
        fileType: fileType,
        filePath: uniqueFileId,  // Store the unique ID instead of a file path
        encryptionKey: key,
        encryptionIv: iv,
        size: size,
        userId: userId,
        tags: {
          connectOrCreate: tagList.map(tagName => ({
            where: { name: tagName },
            create: { name: tagName },
          })),
        },
      },
      include: {
        tags: true,
      },
    });

    // Return success with document details (excluding encryption keys)
    const { encryptionKey: _, encryptionIv: __, ...safeDocument } = document;
    return NextResponse.json({ 
      document: safeDocument,
      uploadUrl: `/api/documents/storage/${uniqueFileId}` // URL for client to upload to browser storage
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'An error occurred while uploading the document' },
      { status: 500 }
    );
  }
}