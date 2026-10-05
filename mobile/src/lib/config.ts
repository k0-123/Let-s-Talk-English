import { Platform } from 'react-native'

/**
 * Where the server is. Set EXPO_PUBLIC_API_URL in mobile/.env. Without it,
 * the Android emulator reaches the host computer at 10.0.2.2 and everything
 * else uses localhost.
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')
).replace(/\/$/, '')

export const WEBSITE_URL = API_URL
