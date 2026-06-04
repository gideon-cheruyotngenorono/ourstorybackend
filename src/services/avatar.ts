export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function isValidAvatar(file: File): { isValid: boolean; error?: string } {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Only JPG, PNG, and WEBP are supported.' };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { isValid: false, error: 'File is too large. Maximum size is 5MB.' };
  }
  return { isValid: true };
}

export function generateInitials(displayName: string): string {
  if (!displayName) return '??';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper to inject avatarInitials natively
export function formatUserWithAvatar<T extends { displayName: string; avatarUrl?: string | null }>(user: T) {
  return {
    ...user,
    avatarUrl: user.avatarUrl || null,
    avatarInitials: user.avatarUrl ? null : generateInitials(user.displayName),
  };
}
