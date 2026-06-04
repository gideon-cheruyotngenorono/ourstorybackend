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

    const { searchParams } = new URL(req.url);
    const getDrafts = searchParams.get('drafts') === 'true';

    const today = new Date();

    let whereClause: any = {
      coupleId: couple.id,
    };

    if (getDrafts) {
       whereClause.authorId = userId;
       whereClause.isDraft = true;
    } else {
       whereClause.isDraft = false;
       whereClause.OR = [
           { authorId: userId }, // Can always see letters I wrote
           { deliverAt: { lte: today } } // Can only see partner's letters if delivery date has passed
       ];
    }

    const letters = await prisma.letter.findMany({
      where: whereClause,
      orderBy: { deliverAt: 'desc' },
      include: { author: { select: { id: true, displayName: true, avatarUrl: true } } }
    });

    const formattedLetters = letters.map((letter: any) => {
      const { author, ...rest } = letter;
      return {
        ...rest,
        sender: formatUserWithAvatar(author)
      };
    });

    return NextResponse.json({ letters: formattedLetters }, { status: 200 });
  } catch (error: any) {
    console.error('[LETTER_LIST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
