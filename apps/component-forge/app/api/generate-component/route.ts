import { proxyToBackend } from '../../../lib/backendProxy';

export async function POST(request: Request): Promise<Response> {
  return proxyToBackend('/generate/component', request);
}

export async function GET(): Promise<Response> {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
