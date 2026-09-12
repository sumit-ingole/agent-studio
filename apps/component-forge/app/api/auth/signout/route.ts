import { proxyToBackend } from '../../../../lib/backendProxy';

export async function POST(request: Request): Promise<Response> {
  const response = await proxyToBackend('/auth/signout', request);
  const result = new Response(null, { status: response.status });
  if (response.ok) {
    result.headers.append('Set-Cookie', 'access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    result.headers.append(
      'Set-Cookie',
      'refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    );
  }
  return result;
}
