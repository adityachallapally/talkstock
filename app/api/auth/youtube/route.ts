// app/api/auth/youtube/route.ts
import { OAuth2Client } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';
import dotenv from "dotenv";

const client = new OAuth2Client(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// Define the scopes
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'];

export async function GET(request: NextRequest) {
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    include_granted_scopes: true // This allows to request additional scopes in the future without re-prompting the user
  });

  return NextResponse.redirect(url);
}