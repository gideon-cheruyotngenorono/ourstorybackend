import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotification } from '@/services/firebase';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] },
      include: { partnerA: true, partnerB: true }
    });

    if (!couple) {
      return NextResponse.json({ error: 'You are not in a couple' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ensure it's not already completed today
    const existing = await prisma.timelineEvent.findFirst({
      where: {
        coupleId: couple.id,
        type: 'Special event',
        title: { contains: 'Bedtime Ritual Completed' },
        date: { gte: today }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Ritual already completed today.' }, { status: 400 });
    }

    const event = await prisma.timelineEvent.create({
      data: {
        coupleId: couple.id,
        title: 'Bedtime Ritual Completed 🌙',
        description: 'Successfully finished the daily connection reflection, prayer, and gratitude limit!',
        date: new Date(),
        type: 'Special event',
      }
    });

    // Send push notification to the partner!
    const partnerUrl = couple.partnerAId === userId ? couple.partnerB : couple.partnerA;
    if (partnerUrl && partnerUrl.fcmToken) {
       await sendNotification(
         partnerUrl.fcmToken,
         "Bedtime Ritual Completed 🌙",
         `${userId === couple.partnerAId ? couple.partnerA.displayName : couple.partnerB?.displayName || 'Your partner'} just finished their daily ritual!`,
         { route: '/timeline' }
       );
    }

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error: any) {
    console.error('[BEDTIME_COMPLETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

