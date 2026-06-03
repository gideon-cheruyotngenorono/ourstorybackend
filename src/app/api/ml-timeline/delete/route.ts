import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { idSchema } from '@/validators/phase4';

export async function DELETE(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');

    const parsed = idSchema.safeParse({ id: idParam });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id } = parsed.data;

    const event = await prisma.timelineEvent.findUnique({
      where: { id },
      include: { couple: true }
    });

    if (!event || (event.couple.partnerAId !== userId && event.couple.partnerBId !== userId)) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 404 });
    }

    await prisma.timelineEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[TIMELINE_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
