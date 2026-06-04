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

    await prisma.archivedChat.deleteMany({
      where: {
        userId,
        coupleId: couple.id
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[CHAT_UNARCHIVE_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
