import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] }
    });

    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 });

    const body = await req.json();
    const { messageId, content, type = 'TEXT', mediaUrl } = body;

    if (!messageId || (!content && !mediaUrl)) {
      return NextResponse.json({ error: 'Missing required reply payload parameters' }, { status: 400 });
    }

    const originalMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { displayName: true } }
      }
    });

    if (!originalMessage) {
      return NextResponse.json({ error: 'Original message not found' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        coupleId: couple.id,
        senderId: userId,
        type,
        content: content || null,
        mediaUrl: mediaUrl || null,
        replyToId: messageId,
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            mediaUrl: true,
            sender: { select: { displayName: true } }
          }
        }
      }
    });

    const channelName = `chat_${couple.id}`;
    supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'new_message',
      payload: { message }
    });

    return NextResponse.json({ success: true, message }, { status: 200 });

  } catch (error: any) {
    console.error('[CHAT_REPLY_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
