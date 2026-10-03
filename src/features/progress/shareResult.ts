import { Share } from 'react-native';

/** Opens the system share sheet. Resolves false if sharing isn't available (e.g. some browsers). */
export async function shareText(message: string): Promise<boolean> {
  try {
    const result = await Share.share({ message });
    return result.action === Share.sharedAction || result.action === Share.dismissedAction;
  } catch {
    return false;
  }
}
