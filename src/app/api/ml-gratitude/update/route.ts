import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateGratitudeSchema } from '@/validators/phase4';

export async function PUT(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = updateGratitudeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, content, date, isShared } = parsed.data;

    const entry = await prisma.gratitudeEntry.findUnique({
      where: { id },
    });

    if (!entry || entry.userId !== userId) {
      return NextResponse.json({ error: 'Gratitude entry not found or unauthorized' }, { status: 404 });
    }

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (date !== undefined) updateData.date = new Date(date);
    if (isShared !== undefined) updateData.isShared = isShared;

    const updatedEntry = await prisma.gratitudeEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ entry: updatedEntry }, { status: 200 });
  } catch (error: any) {
    console.error('[GRATITUDE_UPDATE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
