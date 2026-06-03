import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateContent } from '@/services/ai';

export async function GET(req: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to find if a verse was already generated for today
    let verse = await prisma.verse.findUnique({
      where: { date: today }
    });

    if (!verse) {
      // Generate a new verse using Gemini
      const prompt = `Provide an uplifting and romantic or family-oriented Bible verse from the WEB (World English Bible) translation suitable for a couple (Max and Leona). Format the response strictly as: Reference|Verse Text`;
      
      const responseText = await generateContent(prompt);
      const parts = responseText.split('|');
      
      let reference = "1 Corinthians 13:4-5";
      let text = "Love is patient and is kind; love doesn't envy. Love doesn't brag, is not proud, doesn't behave itself inappropriately, doesn't seek its own way, is not provoked, takes no account of evil;";
      
      if (parts.length >= 2) {
        reference = parts[0].trim();
        text = parts[1].trim();
      }

      verse = await prisma.verse.create({
        data: {
          reference,
          text,
          version: 'WEB',
          date: today,
        }
      });
    }

    return NextResponse.json({ verse }, { status: 200 });
  } catch (error: any) {
    console.error('[VERSE_TODAY]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
