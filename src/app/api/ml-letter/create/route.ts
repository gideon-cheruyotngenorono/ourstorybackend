import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { letterSchema } from '@/validators/phase3';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] }
    });

    if (!couple) {
      return NextResponse.json({ error: 'You are not in a couple' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = letterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, content, deliverAt, isDraft } = parsed.data;

    const letter = await prisma.letter.create({
      data: {
        coupleId: couple.id,
        authorId: userId,
        title,
        content,
        deliverAt: new Date(deliverAt),
        isDraft,
      },
    });

    return NextResponse.json({ message: 'Letter scheduled successfully', letter }, { status: 201 });
  } catch (error: any) {
    console.error('[LETTER_CREATE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
