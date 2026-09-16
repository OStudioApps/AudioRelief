import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

/**
 * Supabase for the app.
 *
 * The session is what matters here: it carries a refresh token that is, in
 * effect, a long-lived password. AsyncStorage is unencrypted, so the token
 * would sit in clear text in the app's sandbox and in device backups.
 *
 * SecureStore is encrypted (Keychain / Keystore) but caps a value at 2048
 * bytes, and a Supabase session is comfortably larger than that. So we follow
 * Supabase's own recommendation: encrypt the session ourselves with a random
 * AES-256 key, keep that small key in SecureStore, and put the ciphertext in
 * AsyncStorage where size is not a problem.
 *
 * SecureStore has no web implementation, so on web we fall back to plain
 * AsyncStorage (localStorage). That is no worse than any other web app, where
 * JS-reachable storage is the only option anyway.
 */

// Expo inlines these at build time, and only with this prefix. It has to be
// dot notation — process.env['EXPO_PUBLIC_…'] is not substituted and reads
// back undefined.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False until .env carries both values. Screens degrade instead of crashing. */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are missing. ' +
      'Copy .env.example to .env. Restart the dev server after editing it — ' +
      'these are inlined at bundle time, not read at runtime.',
  );
}

class LargeSecureStore {
  /** One AES-256 key per stored value, kept in the Keychain/Keystore. */
  private async encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(32));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encrypted);
  }

  private async decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    try {
      return await this.decrypt(key, encrypted);
    } catch {
      // A key we cannot decrypt is a key we cannot use. Clear it and let the
      // person sign in again rather than wedging the app on every launch.
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, await this.encrypt(key, value));
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key).catch(() => {});
  }
}

const sessionStore = Platform.OS === 'web' ? AsyncStorage : new LargeSecureStore();

export const supabase: SupabaseClient = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      storage: sessionStore,
      autoRefreshToken: true,
      persistSession: true,
      // No URL bar on native; OAuth deep links would be handled separately.
      detectSessionInUrl: false,
    },
  },
);

/**
 * Refresh tokens only while the app is in front. Left running in the
 * background it wakes the app to make a network call it cannot use, and on a
 * suspended app the call fails anyway.
 */
AppState.addEventListener('change', (state) => {
  if (!isSupabaseConfigured) return;
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});

/** Supabase's messages are decent; this just guarantees a string. */
export function errorMessage(error: unknown): string {
  if (!error) return 'Something went wrong.';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  const maybe = error as { message?: unknown };
  return typeof maybe.message === 'string' ? maybe.message : 'Something went wrong.';
}
