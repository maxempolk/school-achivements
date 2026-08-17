import { NextResponse, type NextRequest } from 'next/server';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

type AccessTokenPayload = {
  exp?: number;
  role?: string;
};

const accessTokenCookie = 'access_token';
const refreshTokenCookie = 'refresh_token';

const roleHomePath: Record<Role, string> = {
  ADMIN: '/admin/users',
  TEACHER: '/teacher/schedule',
  STUDENT: '/student/diary',
  PARENT: '/parent/diary',
};

const protectedRoleRoutes: Array<{
  prefix: string;
  role: Role;
}> = [
  {
    prefix: '/admin',
    role: 'ADMIN',
  },
  {
    prefix: '/teacher',
    role: 'TEACHER',
  },
  {
    prefix: '/student',
    role: 'STUDENT',
  },
  {
    prefix: '/parent',
    role: 'PARENT',
  },
];

function getRedirectPath(req: NextRequest) {
  return `${req.nextUrl.pathname}${req.nextUrl.search}`;
}

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL('/login', req.url);

  loginUrl.searchParams.set('redirect', getRedirectPath(req));

  return NextResponse.redirect(loginUrl);
}

function redirectToSessionRefresh(req: NextRequest) {
  const refreshUrl = new URL('/session/refresh', req.url);

  refreshUrl.searchParams.set('redirect', getRedirectPath(req));

  return NextResponse.redirect(refreshUrl);
}

function decodeAccessTokenPayload(accessToken: string) {
  const [, payload] = accessToken.split('.');

  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );

    return JSON.parse(atob(paddedBase64)) as AccessTokenPayload;
  } catch {
    return null;
  }
}

function getRoleFromAccessToken(accessToken: string) {
  const payload = decodeAccessTokenPayload(accessToken);

  if (!payload?.role || !isRole(payload.role)) {
    return null;
  }

  if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload.role;
}

function isRole(value: string): value is Role {
  return (
    value === 'ADMIN' ||
    value === 'TEACHER' ||
    value === 'STUDENT' ||
    value === 'PARENT'
  );
}

function getRequiredRole(pathname: string) {
  return protectedRoleRoutes.find(({ prefix }) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  })?.role;
}

export function proxy(req: NextRequest) {
  const accessToken = req.cookies.get(accessTokenCookie)?.value;
  const refreshToken = req.cookies.get(refreshTokenCookie)?.value;
  const { pathname } = req.nextUrl;

  const isRoot = pathname === '/';

  if (!accessToken && !refreshToken) {
    return redirectToLogin(req);
  }

  if (!accessToken) {
    return redirectToSessionRefresh(req);
  }

  const role = getRoleFromAccessToken(accessToken);

  if (!role) {
    return refreshToken ? redirectToSessionRefresh(req) : redirectToLogin(req);
  }

  if (isRoot) {
    return NextResponse.redirect(new URL(roleHomePath[role], req.url));
  }

  const requiredRole = getRequiredRole(pathname);

  if (requiredRole && requiredRole !== role) {
    return NextResponse.redirect(new URL(roleHomePath[role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/parent/:path*',
  ],
};
