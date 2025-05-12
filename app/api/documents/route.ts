import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/app/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function GET(request: NextRequest) {
  noStore();
  
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    
    // Build the query
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(tag ? { tags: { some: { name: tag } } } : {}),
      ...(search ? { 
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { ocrData: { contains: search, mode: 'insensitive' } },
        ] 
      } : {}),
    };
    
    // Get documents and total count
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip,
      }),
      prisma.document.count({ where }),
    ]);
    
    // Remove sensitive fields
    const safeDocuments = documents.map(doc => {
      const { encryptionKey, encryptionIv, ...safeDoc } = doc;
      return safeDoc;
    });
    
    return NextResponse.json({ 
      documents: safeDocuments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching documents' },
      { status: 500 }
    );
  }
}