import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// We fall back through possible env variable names you might have used.
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  '';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadAvatarFile(userId: string, file: File): Promise<{ url: string; path: string; error: string | null }> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `profile.${ext}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error('[SUPABASE_UPLOAD_ERROR]', error);
      return { url: '', path: '', error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, path: filePath, error: null };
  } catch (err: any) {
    console.error('[SUPABASE_UPLOAD_EXCEPTION]', err);
    return { url: '', path: '', error: err.message };
  }
}

export async function deleteAvatarFile(filePath: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('[SUPABASE_DELETE_ERROR]', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[SUPABASE_DELETE_EXCEPTION]', err);
    return { success: false, error: err.message };
  }
}
