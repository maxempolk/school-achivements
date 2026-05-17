import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  if (!API_URL) {
    return NextResponse.json(
      { message: 'API_URL is not configured' },
      { status: 500 },
    );
  }

  const body = await request.json();

  const apiResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!apiResponse.ok) {
    return NextResponse.json(
      { message: 'Invalid credentials' },
      { status: apiResponse.status },
    );
  }

  const data = await apiResponse.json();

  const response = NextResponse.json({
    ok: true,
  });

  response.cookies.set('access_token', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });

  return response;
}
