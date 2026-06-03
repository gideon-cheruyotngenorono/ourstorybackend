import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { idSchema } from '@/validators/phase3';

export async function POST(req: Request) {
  try {
    // Verse operations can be generic or scoped. Since verses are daily and global but favorites might be a couple-level thing?
    // Wait, the schema for Verse has:
    // reference, text, version, date, isFavorite.
    // It doesn't have a coupleId! So it's a global favorite for the APP since it's just for Max and Leona.
    
    // We should still authenticate
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = idSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id } = parsed.data;

    const verse = await prisma.verse.findUnique({
      where: { id },
    });

    if (!verse) {
      return NextResponse.json({ error: 'Verse not found' }, { status: 404 });
    }

    const updatedVerse = await prisma.verse.update({
      where: { id },
      data: { isFavorite: !verse.isFavorite },
    });

    return NextResponse.json({ verse: updatedVerse }, { status: 200 });
  } catch (error: any) {
    console.error('[VERSE_FAVORITE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
