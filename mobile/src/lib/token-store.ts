import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

/**
 * The login token lives in the phone's secure storage (Keychain / Keystore).
 * The web preview has no secure storage, so it falls back to localStorage.
 */
const KEY = 'lte.token'

export const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null
    return await SecureStore.getItemAsync(KEY)
  } catch {
    return null
  }
}

export const setToken = async (token: string | null): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (token) globalThis.localStorage?.setItem(KEY, token)
      else globalThis.localStorage?.removeItem(KEY)
      return
    }
    if (token) await SecureStore.setItemAsync(KEY, token)
    else await SecureStore.deleteItemAsync(KEY)
  } catch {
    // Storage unavailable: the user will simply need to log in again.
  }
}
