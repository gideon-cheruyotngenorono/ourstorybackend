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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor');

    const messages = await prisma.message.findMany({
      where: { coupleId: couple.id },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } }
    });

    const formattedMessages = messages.map(msg => ({
      ...msg,
      sender: formatUserWithAvatar(msg.sender)
    }));

    return NextResponse.json({ messages: formattedMessages }, { status: 200 });
  } catch (error: any) {
    console.error('[CHAT_HISTORY]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
