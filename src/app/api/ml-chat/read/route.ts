import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { idSchema } from '@/validators/phase3';

export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = idSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id } = parsed.data;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // You can only mark messages as read if they were sent to you (in your couple, but sender is not you)
    if (message.senderId === userId) {
      return NextResponse.json({ error: 'You cannot mark your own message as read' }, { status: 400 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ message: updatedMessage }, { status: 200 });
  } catch (error: any) {
    console.error('[CHAT_READ]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
