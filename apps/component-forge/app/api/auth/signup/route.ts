import { proxyToBackend } from '../../../../lib/backendProxy';

export async function POST(request: Request): Promise<Response> {
  const response = await proxyToBackend('/auth/signup', request);
  return withSessionCookies(response);
}

async function withSessionCookies(response: Response): Promise<Response> {
  if (!response.ok) return response;

  const payload = await response.json();
  const result = Response.json(
    {
      user: payload.user ?? null,
      requires_email_confirmation: payload.requires_email_confirmation === true,
    },
    { status: response.status }
  );
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const accessToken = payload.session?.access_token ?? payload.access_token;
  const refreshToken = payload.session?.refresh_token ?? payload.refresh_token;
  if (accessToken) {
    result.headers.append(
      'Set-Cookie',
      `access_token=${encodeURIComponent(accessToken)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=3600`
    );
  }
  if (refreshToken) {
    result.headers.append(
      'Set-Cookie',
      `refresh_token=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=2592000`
    );
  }
  return result;
}
