import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Assuming we want to pull history of all verses sorted by date
    const verses = await prisma.verse.findMany({
      orderBy: { date: 'desc' },
      take: 50, // limit to last 50 for history performance
    });

    return NextResponse.json({ verses }, { status: 200 });
  } catch (error: any) {
    console.error('[VERSE_HISTORY]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
