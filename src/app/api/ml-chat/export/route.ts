import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] }
    });

    if (!couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { coupleId: couple.id, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { displayName: true } }
      }
    });

    let txtContent = `Our Story - Chat Export\n`;
    txtContent += `Exported on ${new Date().toLocaleDateString()}\n`;
    txtContent += `===================================\n\n`;

    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleString();
      const senderName = msg.sender.displayName;
      let text = msg.content || `<${msg.type}> Media attached`;
      txtContent += `[${date}] ${senderName}: ${text}\n`;
    });

    // We can either return the text content as a downloadable string,
    // or upload it to supabase and return a link.
    // Returning base64 encoded text buffer for direct frontend downloading:
    const buffer = Buffer.from(txtContent, 'utf-8');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="chat_export.txt"'
      }
    });

  } catch (error: any) {
    console.error('[CHAT_EXPORT_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
