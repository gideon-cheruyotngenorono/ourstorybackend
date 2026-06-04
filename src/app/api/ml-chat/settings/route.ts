import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Since chat settings aren't strictly defined in the Prisma schema for this upgrade,
    // we return standard defaults. For per-user persistence, a ChatSettings model should be added.
    const settings = {
      mediaAutoDownload: true,
      readReceiptsEnabled: true,
      notificationEnabled: true,
      theme: 'system'
    };

    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error: any) {
    console.error('[CHAT_SETTINGS_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
