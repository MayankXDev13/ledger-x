import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { avatarImageUri, avatarInitials } from "@/lib/avatar";

export type UserAvatarProps = {
  /** The account's display name, when it has one. */
  name?: string | null;
  /** The account's email address. */
  email?: string | null;
  /** The account's OAuth profile image. */
  image?: string | null;
  /** The diameter of the avatar in points. */
  size?: number;
};

/**
 * The signed-in account's avatar.
 *
 * The Google profile photo is shown when the account has one — at the size
 * the photo is rendered at, not the small variant the API hands over. When
 * there is no photo, or the photo cannot be loaded on a patchy connection,
 * the account's initials are shown instead so the badge is never empty.
 */
export default function UserAvatar({
  name,
  email,
  image,
  size = 64,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  // A refreshed session may carry a different photo.
  useEffect(() => {
    setFailed(false);
  }, [image]);

  const uri = failed ? null : avatarImageUri(image);
  const initials = avatarInitials(name, email);
  const label = name?.trim() || email?.trim() || "Account";
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={dimension}
        className="border-2 border-brand-primary/40"
        resizeMode="cover"
        onError={() => setFailed(true)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${label} profile photo`}
      />
    );
  }

  return (
    <View
      style={dimension}
      className="items-center justify-center rounded-full border border-brand-primary/30 bg-brand-primary/15"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label} profile initials`}
    >
      <Text
        style={{
          fontSize: Math.round(size * 0.34),
          lineHeight: Math.round(size * 0.42),
        }}
        className="font-mukta-bold text-brand-primary"
      >
        {initials}
      </Text>
    </View>
  );
}
