import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { clearAuthCookies, REFRESH_TOKEN_COOKIE } from '@/app/api/auth/cookies';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function POST() {
  const response = NextResponse.json({
    ok: true,
  });
  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;

  if (API_URL && refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    }).catch(() => undefined);
  }

  clearAuthCookies(response);

  return response;
}
