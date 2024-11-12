import { NextResponse } from 'next/server';
import { auth } from '@/auth'
import { db } from '@/lib/db';

export async function DELETE() {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all related data
    await db.$transaction([
      // Delete all videos related to the user's series
      db.video.deleteMany({
        where: {
          series: {
            account: {
              userId: user.id
            }
          }
        }
      }),
      // Delete all series related to the user's accounts
      db.series.deleteMany({
        where: {
          account: {
            userId: user.id
          }
        }
      }),
      // Delete all channels related to the user's accounts
      db.channel.deleteMany({
        where: {
          account: {
            userId: user.id
          }
        }
      }),
      // Delete all accounts related to the user
      db.account.deleteMany({
        where: { userId: user.id }
      }),
      // Finally, delete the user
      db.user.delete({
        where: { id: user.id }
      })
    ]);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
