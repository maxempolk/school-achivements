import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from '@/app/api/auth/cookies';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function POST() {
  if (!API_URL) {
    return NextResponse.json(
      { message: 'API_URL is not configured' },
      { status: 500 },
    );
  }

  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    const response = NextResponse.json(
      { message: 'Refresh token is missing' },
      { status: 401 },
    );
    clearAuthCookies(response);

    return response;
  }

  const apiResponse = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!apiResponse.ok) {
    const response = NextResponse.json(
      { message: 'Unable to refresh session' },
      { status: 401 },
    );
    clearAuthCookies(response);

    return response;
  }

  const data = await apiResponse.json();
  const response = NextResponse.json({ ok: true });

  setAuthCookies(response, data);

  return response;
}
