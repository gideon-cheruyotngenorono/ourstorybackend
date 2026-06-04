import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidAvatar } from '@/services/avatar';
import { uploadAvatarFile, deleteAvatarFile } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No avatar file provided' }, { status: 400 });
    }

    const { isValid, error: validationError } = isValidAvatar(file);
    if (!isValid) {
      return NextResponse.json({ error: validationError }, { status: 415 }); // 415 Unsupported Media Type / 413 Payload Too Large
    }

    // Optional: Get the existing user to check if they already have an avatar to delete it if you don't use upsert
    // But since Supabase upsert: true handles overwriting on exact paths, we're okay unless extension changes
    // It's cleaner to delete the old one if it exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPath: true }
    });

    if (user?.avatarPath) {
      await deleteAvatarFile(user.avatarPath);
    }

    const { url, path, error: uploadError } = await uploadAvatarFile(userId, file);
    if (uploadError || !url || !path) {
      return NextResponse.json({ error: 'Failed to upload avatar via Supabase', details: uploadError }, { status: 500 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: url,
        avatarPath: path,
      },
    });

    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatarUrl,
      message: 'Avatar uploaded successfully',
    }, { status: 200 });
  } catch (error: any) {
    console.error('[AVATAR_UPLOAD]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPath: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.avatarPath) {
      const { success, error: deleteError } = await deleteAvatarFile(user.avatarPath);
      if (!success) {
        return NextResponse.json({ error: 'Failed to delete avatar from storage', details: deleteError }, { status: 500 });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        avatarPath: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Avatar deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[AVATAR_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
