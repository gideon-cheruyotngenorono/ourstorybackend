import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateLetterSchema } from '@/validators/phase3';

export async function PUT(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = updateLetterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, title, content, deliverAt, isDraft } = parsed.data;

    const letter = await prisma.letter.findUnique({
      where: { id },
    });

    if (!letter || letter.authorId !== userId) {
      return NextResponse.json({ error: 'Letter not found or unauthorized' }, { status: 404 });
    }
    
    if (!letter.isDraft && isDraft === false && !title && !content && !deliverAt) {
        return NextResponse.json({ error: 'Letter is already finalized.' }, { status: 400 });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (deliverAt) updateData.deliverAt = new Date(deliverAt);
    if (isDraft !== undefined) updateData.isDraft = isDraft;

    const updatedLetter = await prisma.letter.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ letter: updatedLetter }, { status: 200 });
  } catch (error: any) {
    console.error('[LETTER_DRAFT_UPDATE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
