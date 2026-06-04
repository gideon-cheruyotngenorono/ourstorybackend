import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';

// We use the service key because server-side we are executing admin bypass actions
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Helper to upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
): Promise<string | null> {
  if (!supabaseUrl || !supabaseServiceKey) return null;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error during Supabase upload:', error);
    return null;
  }
}

/**
 * Helper to delete a file from Supabase Storage
 */
export async function removeFile(bucket: string, path: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseServiceKey) return false;

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error during Supabase delete:', error);
    return false;
  }
}
