import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] }
    });

    if (!couple) {
      return NextResponse.json({ error: 'You are not in a couple' }, { status: 400 });
    }

    const reasonsCount = await prisma.jarReason.count({
      where: { coupleId: couple.id }
    });

    if (reasonsCount === 0) {
      return NextResponse.json({ error: 'The jar is empty' }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * reasonsCount);

    const randomReason = await prisma.jarReason.findFirst({
      where: { coupleId: couple.id },
      skip,
      include: { creator: { select: { displayName: true } } }
    });

    return NextResponse.json({ reason: randomReason }, { status: 200 });
  } catch (error: any) {
    console.error('[JAR_RANDOM]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
