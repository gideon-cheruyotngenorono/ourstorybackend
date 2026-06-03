import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] }
    });

    if (!couple) {
      return NextResponse.json({ error: 'You are not in a couple' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    let whereClause: any = {
      coupleId: couple.id,
      userId: { not: userId }, // Partner's reflection
      isShared: true,          // Must be shared
    };

    if (dateParam) {
      const targetDate = new Date(dateParam);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.date = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    const reflections = await prisma.reflection.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ reflections }, { status: 200 });
  } catch (error: any) {
    console.error('[REFLECTION_PARTNER]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
