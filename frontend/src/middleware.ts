import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MAX_REDIRECTS = 3;

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token');

  if (!refreshToken) {
    const redirectCount = parseInt(request.cookies.get('redirectCount')?.value ?? '0', 10);
    const currentPath = request.nextUrl.pathname + request.nextUrl.search;

    if (redirectCount >= MAX_REDIRECTS) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('redirectCount');
      return response;
    }

    const response = NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(currentPath)}`, request.url),
    );
    response.cookies.set('redirectCount', String(redirectCount + 1), { path: '/', maxAge: 60 });
    return response;
  }

  const cleanResponse = NextResponse.next();
  cleanResponse.cookies.delete('redirectCount');
  return cleanResponse;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
