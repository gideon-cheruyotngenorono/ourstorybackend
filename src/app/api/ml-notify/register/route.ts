import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  fcmToken: z.string().min(1, "FCM Token is required"),
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { fcmToken } = parsed.data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    return NextResponse.json({ success: true, user: { id: user.id } }, { status: 200 });
  } catch (error: any) {
    console.error('[NOTIFY_REGISTER]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
