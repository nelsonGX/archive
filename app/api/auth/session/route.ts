import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  noStore();
  
  try {
    const session = await auth();
    
    // Return user details without sensitive information
    return NextResponse.json({
      user: session?.user ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      } : null,
      isLoggedIn: !!session?.user,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}