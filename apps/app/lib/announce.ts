import { AccessibilityInfo } from "react-native";

/**
 * Announce a short status message to screen readers.
 *
 * Used for asynchronous state the user cannot see changing — a sync result,
 * a lock error, a QR opening — so it is not a silent visual change.
 */
export function announce(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}
