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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const date = searchParams.get('date'); // YYYY-MM-DD
    const hasMedia = searchParams.get('media') === 'true';

    let whereClause: any = {
      coupleId: couple.id,
      isDeleted: false
    };

    if (query) {
      whereClause.content = { contains: query, mode: 'insensitive' };
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      whereClause.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    if (hasMedia) {
      whereClause.mediaUrl = { not: null };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } }
      }
    });

    return NextResponse.json({ success: true, messages }, { status: 200 });

  } catch (error: any) {
    console.error('[CHAT_SEARCH_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
