// utils/refreshYoutubeToken.ts

import { OAuth2Client } from 'google-auth-library';
import { db } from "@/lib/db";

const client = new OAuth2Client(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

export async function refreshYoutubeToken(id: string) {
  // Fetch the current tokens from the database
  const account = await db.account.findFirst({
    where: { id },
  });

  if (!account) {
    throw new Error('No YouTube account found for this user');
  }

  // Set the credentials
  client.setCredentials({
    refresh_token: account.refreshToken,
  });

  try {
    // Refresh the token
    const { credentials } = await client.refreshAccessToken();

    // Update the database with the new tokens
    await db.account.update({
      where: { id: account.id },
      data: {
        accessToken: credentials.access_token!,
        accessTokenExpires: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      },
    });

    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}