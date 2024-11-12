import { OAuth2Client } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { google } from 'googleapis';
import { db } from "@/lib/db";
import dotenv from "dotenv";
export const dynamic = 'force-dynamic';


console.log("YouTube callback file loaded");

const client = new OAuth2Client(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  console.log("YouTube callback GET function called");
  
  try {
    console.log("Starting YouTube callback process");

    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      console.log("No valid session found");
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const userEmail = session.user.email;
    const user = await db.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      console.log("User not found in database");
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      console.log("No code provided");
      return NextResponse.redirect(new URL('/dashboard/account/link-youtube/youtube-error?error=no_code', request.url));
    }

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: client });
    const response = await youtube.channels.list({
      part: ['snippet'],
      mine: true
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log("No YouTube channels found");
      return NextResponse.redirect(new URL('/dashboard/account/link-youtube/youtube-error?error=no_channels', request.url));
    }

    // Store or update YouTube account
    const accountData = {
      userId: userId,
      platform: 'YouTube',
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? null,
      accessTokenExpires: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    };

    const account = await db.account.upsert({
      where: {
        userId_platform: {
          userId: userId,
          platform: 'YouTube',
        },
      },
      update: accountData,
      create: accountData,
    });

    // Process and store all channels
    await Promise.all(response.data.items.map(async (channel) => {
      const channelData = {
        accountId: account.id,
        channelId: channel.id!,
        title: channel.snippet?.title || 'Untitled Channel',
        thumbnail: channel.snippet?.thumbnails?.default?.url || null,
      };

      await db.channel.upsert({
        where: {
          accountId_channelId: {
            accountId: account.id,
            channelId: channel.id!,
          },
        },
        update: channelData,
        create: channelData,
      });
    }));

    return NextResponse.redirect(new URL('/dashboard/account/link-youtube/youtube-success', request.url));
  } catch (error) {

    console.error('Error in callback route:', error);
    return NextResponse.redirect(new URL('/dashboard/account/link-youtube/youtube-error?error=unknown', request.url));
  }
}