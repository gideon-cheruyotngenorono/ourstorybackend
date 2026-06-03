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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check Reflection
    const reflection = await prisma.reflection.findFirst({
      where: { userId, date: { gte: today } }
    });

    // 2. Check Gratitude
    const gratitude = await prisma.gratitudeEntry.findFirst({
      where: { userId, date: { gte: today } }
    });

    // 3. Check Prayer
    const prayer = await prisma.prayer.findFirst({
      where: { creatorId: userId, createdAt: { gte: today } }
    });

    // 4. Check if already marked complete in Timeline
    const completionEvent = await prisma.timelineEvent.findFirst({
      where: {
        coupleId: couple.id,
        type: 'Special event',
        title: { contains: 'Bedtime Ritual Completed' },
        date: { gte: today }
      }
    });

    return NextResponse.json({
      status: {
        reflectionCompleted: !!reflection,
        gratitudeCompleted: !!gratitude,
        prayerCompleted: !!prayer,
        ritualCompleted: !!completionEvent,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('[BEDTIME_STATUS]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
