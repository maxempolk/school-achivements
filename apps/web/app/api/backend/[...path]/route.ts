import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

  const accessToken = (await cookies()).get('access_token')?.value;
  const headers = new Headers(request.headers);

  for (const header of REQUEST_HEADERS_TO_DROP) {
    headers.delete(header);
  }

  if (accessToken) {
    headers.set('Cookie', `access_token=${accessToken}`);
  }

  const apiResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: METHODS_WITH_BODY.has(request.method) ? request.body : undefined,
    duplex: 'half',
    cache: 'no-store',
  } as RequestInit);

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

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
