import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createCoupleSchema } from '@/validators/auth';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = createCoupleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { partnerEmail, anniversaryDate } = parsed.data;
    if (!partnerEmail) {
      return NextResponse.json({ error: 'Partner email is required' }, { status: 400 });
    }

    // Find partner B
    const partnerB = await prisma.user.findUnique({ where: { email: partnerEmail } });
    if (!partnerB) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    if (partnerB.id === userId) {
      return NextResponse.json({ error: 'You cannot form a couple with yourself.' }, { status: 400 });
    }

    // Check if either is already in a couple
    const existingCouple = await prisma.couple.findFirst({
      where: {
        OR: [
          { partnerAId: userId }, { partnerBId: userId },
          { partnerAId: partnerB.id }, { partnerBId: partnerB.id }
        ]
      }
    });

    if (existingCouple) {
      return NextResponse.json({ error: 'One or both users are already in a couple.' }, { status: 400 });
    }

    const couple = await prisma.couple.create({
      data: {
        partnerAId: userId,
        partnerBId: partnerB.id,
        anniversaryDate: anniversaryDate ? new Date(anniversaryDate) : null,
      },
    });

    return NextResponse.json({ message: 'Couple linked successfully!', couple }, { status: 201 });
  } catch (error: any) {
    console.error('[COUPLE_JOIN]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
