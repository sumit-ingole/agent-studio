export async function GET() {
  return Response.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ComponentForge',
      version: '1.0.0',
    },
    { status: 200 }
  );
}
