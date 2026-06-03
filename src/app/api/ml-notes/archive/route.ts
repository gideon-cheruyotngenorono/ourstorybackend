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

    // Usually only the creator should archive, but maybe the couple can. Let's restrict to creator.
    if (note.creatorId !== userId) {
      return NextResponse.json({ error: 'Only the creator can archive this note' }, { status: 403 });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { isArchived: !note.isArchived }, // Toggle archive status
    });

    return NextResponse.json({ note: updatedNote }, { status: 200 });
  } catch (error: any) {
    console.error('[NOTES_ARCHIVE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
