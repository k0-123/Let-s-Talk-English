import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { Alert, Platform, Share } from 'react-native'

/**
 * Small wrappers over phone features. Each one also works (or quietly does
 * nothing) in the web preview, where some of them are missing.
 */

/** Asks "are you sure?". Alert.alert does nothing on the web, so the browser's confirm is used there. */
export const confirm = (title: string, message: string, confirmLabel = 'OK', destructive = false): Promise<boolean> => {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false)
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  )
}

export const vibrate = (kind: 'tap' | 'success' | 'warning') => {
  if (Platform.OS === 'web') return
  try {
    const done =
      kind === 'tap'
        ? Haptics.selectionAsync()
        : Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning)
    Promise.resolve(done).catch(() => undefined)
  } catch {
    // No vibration motor or haptics unavailable: nothing to do.
  }
}

export const copyText = async (text: string): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(text)
    return true
  } catch {
    return false
  }
}

/** Opens the share sheet; falls back to copying where sharing isn't available. Returns what happened. */
export const shareText = async (message: string): Promise<'shared' | 'copied' | 'failed'> => {
  try {
    if (Platform.OS === 'web' && !(globalThis.navigator as { share?: unknown } | undefined)?.share) {
      return (await copyText(message)) ? 'copied' : 'failed'
    }
    await Share.share({ message })
    return 'shared'
  } catch {
    return (await copyText(message)) ? 'copied' : 'failed'
  }
}
