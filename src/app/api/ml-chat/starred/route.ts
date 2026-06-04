import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const starred = await prisma.starredMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: {
            sender: { select: { id: true, displayName: true, avatarUrl: true } }
          }
        }
      }
    });

    const messages = starred.map(s => s.message);

    return NextResponse.json({ success: true, messages }, { status: 200 });
  } catch (error: any) {
    console.error('[CHAT_STARRED_LIST_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
