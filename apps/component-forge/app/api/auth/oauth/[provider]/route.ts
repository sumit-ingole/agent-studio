import { proxyToBackend } from '../../../../../lib/backendProxy';

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
): Promise<Response> {
  return proxyToBackend(`/auth/oauth/${encodeURIComponent(params.provider)}`, request);
}
