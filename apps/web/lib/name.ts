// Display-name helpers shared by the sidebar identity chip and mobile
// account surfaces (see openspec/changes/replace-profile-page-with-avatar).

/**
 * Derive the first name shown on identity chips: the first whitespace
 * token of the authenticated user's `name`, falling back to the email
 * local-part, then to a neutral label. All inputs are optional/nullable.
 */
export function deriveFirstName(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const firstToken = name?.trim().split(/\s+/)[0];
  if (firstToken) return firstToken;
  const localPart = email?.split("@")[0].trim();
  if (localPart) return localPart;
  return "Account";
}

/** First two characters of the email, uppercased, for avatar fallbacks. */
export function avatarInitials(email: string | null | undefined): string {
  if (!email) return "LX";
  return email.slice(0, 2).toUpperCase();
}
