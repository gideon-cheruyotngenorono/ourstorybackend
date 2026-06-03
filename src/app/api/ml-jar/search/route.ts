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
    const category = searchParams.get('category');
    const query = searchParams.get('query');

    let whereClause: any = {
      coupleId: couple.id,
    };

    if (category) {
      whereClause.category = category;
    }

    if (query) {
      whereClause.content = {
        contains: query,
        mode: 'insensitive', // Search without matching exact case
      };
    }

    const reasons = await prisma.jarReason.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { displayName: true } } }
    });

    return NextResponse.json({ reasons }, { status: 200 });
  } catch (error: any) {
    console.error('[JAR_SEARCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
