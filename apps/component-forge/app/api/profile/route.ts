import { proxyToBackend } from '../../../lib/backendProxy';

export async function GET(request: Request): Promise<Response> {
  return proxyToBackend('/profile', request);
}
