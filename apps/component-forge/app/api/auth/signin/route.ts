import { proxyToBackend } from '../../../../lib/backendProxy';

export async function POST(request: Request): Promise<Response> {
  const response = await proxyToBackend('/auth/signin', request);
  if (!response.ok) return response;

  const payload = await response.json();
  const result = Response.json({ user: payload.user ?? null }, { status: response.status });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  if (payload.access_token) {
    result.headers.append(
      'Set-Cookie',
      `access_token=${encodeURIComponent(payload.access_token)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=3600`
    );
  }
  if (payload.refresh_token) {
    result.headers.append(
      'Set-Cookie',
      `refresh_token=${encodeURIComponent(payload.refresh_token)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=2592000`
    );
  }
  return result;
}
