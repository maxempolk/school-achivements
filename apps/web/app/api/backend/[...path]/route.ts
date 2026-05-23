import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from '@/app/api/auth/cookies';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

type ProxyContext = {
  params: Promise<{
    path: string[];
  }>;
};

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const REQUEST_HEADERS_TO_DROP = [
  'host',
  'cookie',
  'connection',
  'content-length',
];
const RESPONSE_HEADERS_TO_DROP = [
  'set-cookie',
  'content-encoding',
  'content-length',
  'transfer-encoding',
];

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

async function proxy(request: NextRequest, context: ProxyContext) {
  if (!API_URL) {
    return NextResponse.json(
      { message: 'API_URL is not configured' },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const targetPath = path
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const targetUrl = new URL(targetPath, `${API_URL.replace(/\/$/, '')}/`);
  targetUrl.search = request.nextUrl.search;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const headers = new Headers(request.headers);
  const requestBody = METHODS_WITH_BODY.has(request.method)
    ? await request.arrayBuffer()
    : undefined;

  for (const header of REQUEST_HEADERS_TO_DROP) {
    headers.delete(header);
  }

  const apiResponse = await fetchBackend({
    targetUrl,
    request,
    headers,
    body: requestBody,
    accessToken,
  });

  if (apiResponse.status !== 401 || !refreshToken) {
    return toProxyResponse(apiResponse);
  }

  const refreshedTokens = await refreshAuthTokens(refreshToken);

  if (!refreshedTokens) {
    const response = toProxyResponse(apiResponse);
    clearAuthCookies(response);

    return response;
  }

  const retryResponse = await fetchBackend({
    targetUrl,
    request,
    headers,
    body: requestBody,
    accessToken: refreshedTokens.accessToken,
  });
  const response = toProxyResponse(retryResponse);

  setAuthCookies(response, refreshedTokens);

  return response;
}

async function fetchBackend({
  targetUrl,
  request,
  headers,
  body,
  accessToken,
}: {
  targetUrl: URL;
  request: NextRequest;
  headers: Headers;
  body?: ArrayBuffer;
  accessToken?: string;
}) {
  const requestHeaders = new Headers(headers);

  if (accessToken) {
    requestHeaders.set('Cookie', `${ACCESS_TOKEN_COOKIE}=${accessToken}`);
  } else {
    requestHeaders.delete('Cookie');
  }

  return fetch(targetUrl, {
    method: request.method,
    headers: requestHeaders,
    body,
    duplex: 'half',
    cache: 'no-store',
  } as RequestInit);
}

function toProxyResponse(apiResponse: Response) {
  const responseHeaders = new Headers(apiResponse.headers);

  for (const header of RESPONSE_HEADERS_TO_DROP) {
    responseHeaders.delete(header);
  }

  return new NextResponse(apiResponse.body, {
    status: apiResponse.status,
    statusText: apiResponse.statusText,
    headers: responseHeaders,
  });
}

async function refreshAuthTokens(refreshToken: string) {
  if (!API_URL) {
    return null;
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
    return null;
  }

  return (await apiResponse.json()) as AuthTokens;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
