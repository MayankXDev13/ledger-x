/**
 * Avatar helpers for the signed-in account.
 *
 * The Google profile photo is stored on the user record and arrives as a
 * small variant (96px), which looks soft in an avatar-sized frame. These
 * helpers pick the display-size variant of that image and derive the
 * initials used when no image can be shown.
 */

/** Hosts that serve the Google profile photo. */
const GOOGLE_IMAGE_HOSTS = ["googleusercontent.com"];

/** The size the avatar is rendered at, so the photo is not upscaled. */
const DISPLAY_SIZE = 256;

/** Fallback when the account has neither a name nor an email. */
const FALLBACK_INITIALS = "S";

/**
 * The initials of the signed-in account.
 *
 * The display name comes first (it is the real identity), then the email
 * local part, so the badge never shows a raw mailbox handle.
 */
export function avatarInitials(
  name?: string | null,
  email?: string | null,
): string {
  const fromName = initialsFromWords(name);
  if (fromName) return fromName;

  const localPart = email?.split("@")[0]?.trim() ?? "";
  const fromEmail = initialsFromWords(localPart.split(/[._\-+]+/).join(" "));
  return fromEmail || FALLBACK_INITIALS;
}

/** The image to render, or null when there is nothing usable to show. */
export function avatarImageUri(image?: string | null): string | null {
  const url = (image ?? "").trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return withDisplaySize(url);
}

/** The first letter of up to two words, upper-cased. */
function initialsFromWords(value?: string | null): string {
  const words = (value ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();
}

/**
 * Ask Google for a display-size variant of the photo.
 *
 * Other hosts are left untouched: only the Google size suffix is known to
 * be safe to rewrite.
 */
function withDisplaySize(url: string): string {
  if (!GOOGLE_IMAGE_HOSTS.some((host) => url.includes(host))) return url;
  return url.replace(
    /=s\d+(-[a-z]+)?$/i,
    (_match, suffix: string | undefined) => `=s${DISPLAY_SIZE}${suffix ?? ""}`,
  );
}
