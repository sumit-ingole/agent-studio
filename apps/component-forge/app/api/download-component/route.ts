import JSZip from 'jszip';
import { z } from 'zod';

const RequestSchema = z.object({
  files: z.record(z.string().min(1), z.string()),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ message: 'Unable to create the component archive.' }, { status: 400 });
    }

    const zip = new JSZip();
    Object.entries(parsed.data.files).forEach(([filename, content]) => {
      zip.file(filename, content);
    });

    const archive = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    return new Response(archive as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="component.zip"',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return Response.json({ message: 'Unable to create the component archive.' }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  return Response.json({ message: 'Method not allowed' }, { status: 405 });
}
