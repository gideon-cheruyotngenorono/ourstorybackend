import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatUserWithAvatar } from '@/services/avatar';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] },
      include: {
        partnerA: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          }
        },
        partnerB: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          }
        }
      }
    });

    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }

    // Calculate days together from anniversaryDate, fallback to createdAt if not set
    const referenceDate = couple.anniversaryDate || couple.createdAt;
    const diffTime = Math.abs(new Date().getTime() - new Date(referenceDate).getTime());
    const daysTogether = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      partnerA: formatUserWithAvatar(couple.partnerA),
      partnerB: couple.partnerB ? formatUserWithAvatar(couple.partnerB) : null,
      daysTogether,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[COUPLE_PROFILE_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
