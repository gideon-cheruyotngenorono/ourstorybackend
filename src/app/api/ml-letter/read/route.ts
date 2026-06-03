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

    const letter = await prisma.letter.findUnique({
      where: { id },
      include: { couple: true }
    });

    if (!letter || (letter.couple.partnerAId !== userId && letter.couple.partnerBId !== userId)) {
      return NextResponse.json({ error: 'Letter not found or unauthorized' }, { status: 404 });
    }
    
    if (letter.authorId === userId) {
      return NextResponse.json({ error: 'You cannot mark your own letter as read' }, { status: 400 });
    }
    
    if (new Date() < letter.deliverAt) {
      return NextResponse.json({ error: 'Cannot read letter before its scheduled delivery date' }, { status: 400 });
    }

    const updatedLetter = await prisma.letter.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ letter: updatedLetter }, { status: 200 });
  } catch (error: any) {
    console.error('[LETTER_READ]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
