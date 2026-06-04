import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatUserWithAvatar } from '@/services/avatar';

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

    // Fetch reflections that belong to the user OR are shared by the partner
    const reflections = await prisma.reflection.findMany({
      where: {
        coupleId: couple.id,
        OR: [
          { userId: userId },
          { isShared: true }
        ]
      },
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
    });

    const formattedReflections = reflections.map(reflection => {
      const { user, ...rest } = reflection;
      return {
        ...rest,
        author: formatUserWithAvatar(user)
      };
    });

    return NextResponse.json({ reflections: formattedReflections }, { status: 200 });
  } catch (error: any) {
    console.error('[REFLECTION_LIST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
