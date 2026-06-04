import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatUserWithAvatar } from '@/services/avatar';

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

    // The timeline fetches events sorted descending by date for the feed.
    const events = await prisma.timelineEvent.findMany({
      where: { coupleId: couple.id },
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
    });

    const formattedEvents = events.map((event: any) => {
      const { user, ...rest } = event;
      return {
        ...rest,
        author: user ? formatUserWithAvatar(user) : null
      };
    });

    return NextResponse.json({ events: formattedEvents }, { status: 200 });
  } catch (error: any) {
    console.error('[TIMELINE_LIST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
