import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // We'll export the direct supabase client from here or inject dynamically

const TYPE_LIMITS: Record<string, number> = {
  IMAGE: 10 * 1024 * 1024,   // 10 MB
  VIDEO: 50 * 1024 * 1024,   // 50 MB
  AUDIO: 20 * 1024 * 1024,   // 20 MB
  FILE: 25 * 1024 * 1024,    // 25 MB
};

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // IMAGE, VIDEO, AUDIO, FILE

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or type parameter' }, { status: 400 });
    }

    const limit = TYPE_LIMITS[type.toUpperCase()];
    if (!limit) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    if (file.size > limit) {
      return NextResponse.json({ error: `File too large for type ${type}. Maximum is ${limit / 1024 / 1024}MB` }, { status: 413 });
    }

    const ext = file.name.split('.').pop() || 'tmp';
    const filePath = `chat/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('media') // Assuming a bucket named 'media' for chats
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      console.error('[STORAGE_UPLOAD]', uploadError);
      return NextResponse.json({ error: 'Failed to upload to storage: ' + uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from('media').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: data.publicUrl,
      size: file.size,
      originalName: file.name
    }, { status: 200 });

  } catch (error: any) {
    console.error('[STORAGE_ENDPOINT_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
