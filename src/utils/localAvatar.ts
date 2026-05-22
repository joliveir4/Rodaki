import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const AVATAR_KEY_PREFIX = 'avatar:';
const AVATAR_DIR = `${FileSystem.documentDirectory ?? ''}avatars/`;

function getStorageKey(userId: string): string {
  return `${AVATAR_KEY_PREFIX}${userId}`;
}

async function ensureAvatarDir(): Promise<void> {
  if (!AVATAR_DIR) return;
  const info = await FileSystem.getInfoAsync(AVATAR_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AVATAR_DIR, { intermediates: true });
  }
}

export async function getLocalAvatar(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(getStorageKey(userId));
  } catch {
    return null;
  }
}

export async function saveLocalAvatar(userId: string, uri: string): Promise<string> {
  await AsyncStorage.setItem(getStorageKey(userId), uri);
  return uri;
}

export async function saveLocalAvatarFromUri(userId: string, uri: string): Promise<string> {
  await ensureAvatarDir();
  const extension = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const targetUri = `${AVATAR_DIR}${userId}.${extension}`;
  try {
    await FileSystem.deleteAsync(targetUri, { idempotent: true });
  } catch {
    // Ignore cleanup failures.
  }
  await FileSystem.copyAsync({ from: uri, to: targetUri });
  return saveLocalAvatar(userId, targetUri);
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(blob);
  });
}

export async function saveLocalAvatarFromFile(userId: string, file: Blob): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  return saveLocalAvatar(userId, dataUrl);
}
