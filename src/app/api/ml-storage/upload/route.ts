import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadFile } from '@/services/supabase';

// App Router handles body stream natively
export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'Attachment';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique path: <userId>/<timestamp>-<filename>
    const path = `${userId}/${Date.now()}-${file.name.replace(/\\s+/g, '-')}`;

    // 'our-story-media' is the presumed default bucket
    const url = await uploadFile('our-story-media', path, buffer, file.type);

    if (!url) {
      // Return 500 but don't crash if keys aren't preset.
      return NextResponse.json({ error: 'Failed to upload to storage bucket. Ensure Supabase credentials are valid.' }, { status: 500 });
    }

    // Register media file in database
    const mediaFile = await prisma.mediaFile.create({
      data: {
        url,
        type,
        size: file.size,
      }
    });

    return NextResponse.json({ url: mediaFile.url, id: mediaFile.id }, { status: 201 });
  } catch (error: any) {
    console.error('[STORAGE_UPLOAD]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
