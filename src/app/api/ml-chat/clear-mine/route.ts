import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] }
    });

    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 });

    // Update or create ChatVisibility
    await prisma.chatVisibility.upsert({
      where: {
        userId_coupleId: {
          userId,
          coupleId: couple.id
        }
      },
      update: {
        lastClearedAt: new Date()
      },
      create: {
        userId,
        coupleId: couple.id,
        lastClearedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, message: 'Chat cleared for you' }, { status: 200 });
  } catch (error: any) {
    console.error('[CHAT_CLEAR_MINE_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
