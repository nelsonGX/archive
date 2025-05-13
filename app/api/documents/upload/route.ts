import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';
import { generateEncryptionKey } from '@/app/lib/serverEncryption';
import { saveEncryptedFile, generateUniqueFileId } from '@/app/lib/fileStorage';
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
    const runOcr = formData.get('ocr') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate a unique file ID and encryption keys
    const uniqueFileId = generateUniqueFileId();
    const { key, iv } = generateEncryptionKey();
    
    // Get file info
    const size = file.size;
    const originalName = file.name;
    const fileType = file.type.split('/')[1] || 'pdf';

    // Parse tags if present
    const tagList = tags ? tags.split(',').map(tag => tag.trim()) : [];

    // Convert file to buffer for server-side storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save encrypted file to server storage
    await saveEncryptedFile(uniqueFileId, buffer, key, iv);

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        name: originalName,
        fileType: fileType,
        filePath: uniqueFileId,  // Store the unique ID for server-side file
        encryptionKey: key,
        encryptionIv: iv,
        size: size,
        userId: userId,
        ocr: runOcr, // Set based on user's choice
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

    // Return document details without encryption keys
    const { encryptionKey, encryptionIv, ...safeDocument } = document;
    
    return NextResponse.json({
      document: safeDocument,
      success: true
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'An error occurred while uploading the document' },
      { status: 500 }
    );
  }
}