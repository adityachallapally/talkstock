import { NextResponse } from 'next/server';
import { auth } from './auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard/series') ||
    req.nextUrl.pathname.startsWith('/dashboard/account');

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/api/auth/signin', req.url));
  }

  return NextResponse.next();
});

// Update the matcher to include dashboard/series and dashboard/account routes
export const config = {
  matcher: [
    '/dashboard/series/:path*',
    '/dashboard/account/:path*',
    "/api/auth/youtube/:path*",
  ],
};