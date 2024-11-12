// utils/youtubeApiWrapper.ts

import { google } from 'googleapis';
import { refreshYoutubeToken } from './refreshYoutubeToken';
import { db } from "@/lib/db";

export async function youtubeApiWrapper(userId: string, apiCall: (auth: any) => Promise<any>) {
  const account = await db.account.findFirst({
    where: { userId, platform: 'YouTube' },
  });

  if (!account) {
    throw new Error('No YouTube account found for this user');
  }

  let accessToken = account.accessToken;

  // Check if token is expired or will expire in the next 5 minutes
  if (!account.accessTokenExpires || account.accessTokenExpires.getTime() - 5 * 60 * 1000 < Date.now()) {
    accessToken = await refreshYoutubeToken(userId);
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return apiCall(auth);
}