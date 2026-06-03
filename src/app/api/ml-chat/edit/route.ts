import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { editMessageSchema } from '@/validators/phase3';

export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = editMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, content } = parsed.data;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message || message.senderId !== userId) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json({ message: updatedMessage }, { status: 200 });
  } catch (error: any) {
    console.error('[CHAT_EDIT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
