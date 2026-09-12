export async function POST(request: Request): Promise<Response> {
  const payload = await request.json().catch(() => ({}));
  if (typeof payload.access_token !== 'string' || typeof payload.refresh_token !== 'string') {
    return Response.json({ message: 'Invalid session.' }, { status: 400 });
  }
  const response = Response.json({ ok: true });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.headers.append(
    'Set-Cookie',
    `access_token=${encodeURIComponent(payload.access_token)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=3600`
  );
  response.headers.append(
    'Set-Cookie',
    `refresh_token=${encodeURIComponent(payload.refresh_token)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=2592000`
  );
  return response;
}
