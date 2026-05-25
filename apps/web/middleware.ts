import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;
  const refreshToken = req.cookies.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    // return NextResponse.redirect(new URL('/login', request.url));
    const loginUrl = new URL('/login', req.url);

    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/parent/:path*',
  ],
};
// TODO: доделать
