import { NextResponse } from 'next/server';

import { setAuthCookies } from '@/app/api/auth/cookies';

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

  setAuthCookies(response, data);

  return response;
}
