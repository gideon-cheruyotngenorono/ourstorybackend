import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: 'email, token, and newPassword are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken || resetToken.userId !== user.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    // Cryptographically hash the new password natively mapped exactly like register/route.ts
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Clean up all reset tokens for this specific user strictly!
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json({ success: true, message: 'Password has been reset successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[AUTH_RESET_PASSWORD]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
