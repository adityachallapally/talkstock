import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        accounts: {
          where: { platform: 'YouTube' },
          take: 1,
          select: {
            id: true,
            platform: true,
            // Add other fields you need from the account
          }
        }
      }
    });

    if (!user || user.accounts.length === 0) {
      return NextResponse.json({ error: 'No YouTube account found' }, { status: 404 });
    }

    return NextResponse.json({ account: user.accounts[0] });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
