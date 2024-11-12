import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

export async function GET() {
  try {
    // Get the first YouTube account from the database
    const account = await prisma.account.findFirst({
      where: { platform: 'YouTube' },
    });

    if (!account) {
      return NextResponse.json({ error: 'No YouTube account found' }, { status: 404 });
    }

    // Set the credentials for the OAuth2 client
    oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
    });

    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update the account with the new access token and expiration
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: credentials.access_token,
        accessTokenExpires: new Date(credentials.expiry_date || Date.now() + 3600000),
      },
    });

    return NextResponse.json({ 
      message: 'Token refreshed successfully', 
      account: {
        id: updatedAccount.id,
        platform: updatedAccount.platform,
        accessTokenExpires: updatedAccount.accessTokenExpires
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    let errorMessage = 'Failed to refresh token';
    let statusCode = 500;

    if (error.message.includes('invalid_grant')) {
      errorMessage = 'The refresh token is invalid or has been revoked';
      statusCode = 401;
    } else if (error.message.includes('invalid_client')) {
      errorMessage = 'Invalid client credentials';
      statusCode = 401;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  } finally {
    await prisma.$disconnect();
  }
}