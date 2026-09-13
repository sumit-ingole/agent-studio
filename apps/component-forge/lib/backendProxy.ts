import { headers } from 'next/headers';

const backendUrl = process.env.BACKEND_API_URL;
const proxySecret = process.env.BACKEND_PROXY_SECRET;

export async function proxyToBackend(path: string, request: Request): Promise<Response> {
  if (!backendUrl || !proxySecret) {
    return Response.json({ error: 'Backend is not configured', status: 503 }, { status: 503 });
  }

  const incomingHeaders = headers();
  const forwardedHeaders = new Headers();
  const contentType = incomingHeaders.get('content-type');
  const cookie = incomingHeaders.get('cookie');
  if (contentType) forwardedHeaders.set('content-type', contentType);
  if (cookie) forwardedHeaders.set('cookie', cookie);
  forwardedHeaders.set('x-backend-proxy-secret', proxySecret);

  let response: Response;
  try {
    response = await fetch(`${backendUrl.replace(/\/$/, '')}${path}`, {
      method: request.method,
      headers: forwardedHeaders,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return Response.json({ error: 'Backend unavailable', status: 502 }, { status: 502 });
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('content-length');
  responseHeaders.delete('content-encoding');
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
