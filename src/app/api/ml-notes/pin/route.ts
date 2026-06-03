import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { idSchema } from '@/validators/phase3';

export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = idSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id } = parsed.data;

    const note = await prisma.note.findUnique({
      where: { id },
      include: { couple: true }
    });

    if (!note || (note.couple.partnerAId !== userId && note.couple.partnerBId !== userId)) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { isPinned: !note.isPinned },
    });

    return NextResponse.json({ note: updatedNote }, { status: 200 });
  } catch (error: any) {
    console.error('[NOTES_PIN]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
