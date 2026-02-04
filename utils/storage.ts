import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Custom storage adapter for Supabase that uses:
 * - SecureStore on native platforms (iOS/Android) - encrypted storage
 * - localStorage on web (browser only, not SSR)
 */
class SupabaseStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Web: use localStorage only if in browser (not SSR)
        if (isBrowser) {
          return window.localStorage.getItem(key);
        }
        // SSR context - return null
        return null;
      } else {
        // Native: use SecureStore (encrypted)
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (isBrowser) {
          window.localStorage.setItem(key, value);
        }
        // Do nothing in SSR context
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (isBrowser) {
          window.localStorage.removeItem(key);
        }
        // Do nothing in SSR context
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }
}

export const supabaseStorage = new SupabaseStorage();
