import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateContent } from '@/services/ai';

export async function GET(req: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let topic = await prisma.discussionTopic.findUnique({
      where: { date: today }
    });

    if (!topic) {
      // Possible categories 
      const types = ["Romantic", "Faith", "Future", "Marriage", "Personal Growth"];
      const selectedType = types[Math.floor(Math.random() * types.length)];

      const prompt = `Generate a single deep, meaningful discussion question for a couple (Max and Leona) focused on the category: ${selectedType}. Only return the question itself, without any conversational filler or quotes.`;
      
      const question = await generateContent(prompt);
      
      topic = await prisma.discussionTopic.create({
        data: {
          question: question || "What is a memory from our relationship that always makes you smile?",
          type: selectedType,
          date: today,
        }
      });
    }

    return NextResponse.json({ topic }, { status: 200 });
  } catch (error: any) {
    console.error('[DISCUSSION_TODAY]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
