import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether the email exists or not to prevent user enumeration
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link was sent.' }, { status: 200 });
    }

    // Deconstruct old tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Create a robust 6-digit confirmation PIN (or UUID if link is preferred)
    const pin = Math.floor(100000 + Math.random() * 900000).toString(); // "538291"
    
    // Expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: pin,
        expiresAt
      }
    });

    // Send the email (Requires SMTP configuration in .env)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Our Story App" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Your Password Reset Request',
        html: `
          <h3>Our Story - Password Reset</h3>
          <p>You requested a password reset. Your 6-digit secure code is:</p>
          <h2 style="letter-spacing: 5px;">${pin}</h2>
          <p>This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        `
      });
    } else {
      console.warn('[AUTH_FORGOT_PASSWORD] No SMTP credentials in .env. Pin generated:', pin);
    }

    return NextResponse.json({ success: true, message: 'If an account exists, a reset link was sent.' }, { status: 200 });
  } catch (error: any) {
    console.error('[AUTH_FORGOT_PASSWORD]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
