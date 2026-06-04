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

    const messages = await prisma.message.findMany({
      where: {
        coupleId: couple.id,
        isDeleted: false,
        type: { in: ['IMAGE', 'VIDEO', 'AUDIO', 'FILE'] }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        mediaUrl: true,
        thumbnailUrl: true,
        createdAt: true,
        fileName: true
      }
    });

    const gallery = {
      images: messages.filter(m => m.type === 'IMAGE'),
      videos: messages.filter(m => m.type === 'VIDEO'),
      audio: messages.filter(m => m.type === 'AUDIO'),
      documents: messages.filter(m => m.type === 'FILE'),
    };

    return NextResponse.json({ success: true, gallery }, { status: 200 });

  } catch (error: any) {
    console.error('[CHAT_MEDIA_GALLERY_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
