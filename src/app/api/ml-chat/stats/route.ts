import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] }
    });

    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 });

    const [totalMessages, photosShared, voiceNotes, firstMessage] = await Promise.all([
      prisma.message.count({ where: { coupleId: couple.id, isDeleted: false } }),
      prisma.message.count({ where: { coupleId: couple.id, isDeleted: false, type: 'IMAGE' } }),
      prisma.message.count({ where: { coupleId: couple.id, isDeleted: false, type: 'AUDIO' } }),
      prisma.message.findFirst({
        where: { coupleId: couple.id, isDeleted: false },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      })
    ]);

    let daysMessaging = 0;
    if (firstMessage) {
      const diffTime = Math.abs(new Date().getTime() - new Date(firstMessage.createdAt).getTime());
      daysMessaging = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const stats = {
      totalMessages,
      photosShared,
      voiceNotes,
      daysMessaging,
      firstMessageDate: firstMessage ? firstMessage.createdAt : null
    };

    return NextResponse.json({ success: true, stats }, { status: 200 });
  } catch (error: any) {
    console.error('[CHAT_STATS_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
