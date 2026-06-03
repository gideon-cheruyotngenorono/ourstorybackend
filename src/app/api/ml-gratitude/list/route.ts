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

    const entries = await prisma.gratitudeEntry.findMany({
      where: {
        coupleId: couple.id,
        OR: [
          { userId: userId },
          { isShared: true }
        ]
      },
      orderBy: { date: 'desc' },
      include: { user: { select: { displayName: true } } }
    });

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error: any) {
    console.error('[GRATITUDE_LIST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
