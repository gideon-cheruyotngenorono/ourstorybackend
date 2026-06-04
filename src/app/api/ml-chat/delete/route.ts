import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

const DELETE_FOR_EVERYONE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) { // Using POST for complex delete payload
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { messageId, type = 'FOR_ME' } = body; // FOR_ME | FOR_EVERYONE

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const channelName = `chat_${message.coupleId}`;

    if (type === 'FOR_EVERYONE') {
      if (message.senderId !== userId) {
        return NextResponse.json({ error: 'You can only delete your own messages for everyone' }, { status: 403 });
      }

      const timeElapsed = new Date().getTime() - new Date(message.createdAt).getTime();
      if (timeElapsed > DELETE_FOR_EVERYONE_WINDOW_MS) {
        return NextResponse.json({ error: 'Delete window expired (1 hour limit)' }, { status: 403 });
      }

      // Soft delete for everyone
      await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: null,
          mediaUrl: null,
          fileName: null,
          type: 'SYSTEM'
        }
      });

      supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'message_deleted',
        payload: { messageId, scope: 'EVERYONE' }
      });

    } else if (type === 'FOR_ME') {
      // Since Soft Delete FOR_ME wasn't directly in the schema without a many-to-many visibility array,
      // a simple approach for individual messages is tricky if `deletedForMeIds` array isn't on User.
      // So instead, we will use a workaround, or throw an unimplemented for individual FOR_ME.
      // Easiest is to add a `DeletedMessageVisibility` or just rely on ChatVisibility for bulk clears.
      // Assuming for now, we just skip it or perform a workaround (we could use StarredMessage model logic but inverted).
      return NextResponse.json({ error: 'FOR_ME individual delete not fully mapped in Prisma. Use clear-mine for bulk' }, { status: 501 });
    } else {
      return NextResponse.json({ error: 'Invalid delete type' }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('[CHAT_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Support DELETE method as well for simplicity
export async function DELETE(req: Request) {
  return POST(req);
}
