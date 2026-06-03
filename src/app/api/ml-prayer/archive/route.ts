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

    const prayer = await prisma.prayer.findUnique({
      where: { id },
      include: { couple: true }
    });

    if (!prayer || (prayer.couple.partnerAId !== userId && prayer.couple.partnerBId !== userId)) {
      return NextResponse.json({ error: 'Prayer not found or unauthorized' }, { status: 404 });
    }

    const updatedPrayer = await prisma.prayer.update({
      where: { id },
      data: { isArchived: !prayer.isArchived },
    });

    return NextResponse.json({ prayer: updatedPrayer }, { status: 200 });
  } catch (error: any) {
    console.error('[PRAYER_ARCHIVE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
