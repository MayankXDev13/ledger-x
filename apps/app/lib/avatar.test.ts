import { describe, expect, it } from "bun:test";
import { avatarImageUri, avatarInitials } from "./avatar";

describe("avatarInitials", () => {
  it("uses the display name when the account has one", () => {
    expect(avatarInitials("Vijay Kumar", "vk@example.com")).toBe("VK");
  });

  it("uses the first two words of a longer name", () => {
    expect(avatarInitials("Mayank Kumar Sharma", "m@example.com")).toBe("MK");
  });

  it("falls back to the email local part when there is no name", () => {
    expect(avatarInitials(null, "vk6742621@gmail.com")).toBe("V");
    expect(avatarInitials("", "vk6742621@gmail.com")).toBe("V");
  });

  it("reads a separated email local part as words", () => {
    expect(avatarInitials(null, "ramesh.kirana@gmail.com")).toBe("RK");
  });

  it("falls back to a neutral initial when nothing is known", () => {
    expect(avatarInitials(null, null)).toBe("S");
    expect(avatarInitials("   ", "   ")).toBe("S");
  });

  it("ignores a stray digit run in the email local part", () => {
    expect(avatarInitials(null, "vijaykumar808050@gmail.com")).toBe("V");
  });
});

describe("avatarImageUri", () => {
  it("returns null when there is no image", () => {
    expect(avatarImageUri(null)).toBeNull();
    expect(avatarImageUri("")).toBeNull();
    expect(avatarImageUri("   ")).toBeNull();
  });

  it("returns null for a value that is not an http url", () => {
    expect(avatarImageUri("data:image/png;base64,abc")).toBeNull();
    expect(avatarImageUri("/avatars/me.png")).toBeNull();
  });

  it("asks Google for a display-size variant of the photo", () => {
    expect(
      avatarImageUri(
        "https://lh3.googleusercontent.com/a/ACg8ocKlg3EppCoq=s96-c",
      ),
    ).toBe("https://lh3.googleusercontent.com/a/ACg8ocKlg3EppCoq=s256-c");
  });

  it("keeps the crop marker of the original photo", () => {
    expect(
      avatarImageUri(
        "https://lh3.googleusercontent.com/a/ACg8ocKlg3EppCoq=s96",
      ),
    ).toBe("https://lh3.googleusercontent.com/a/ACg8ocKlg3EppCoq=s256");
  });

  it("leaves a photo without a size suffix untouched", () => {
    expect(
      avatarImageUri("https://lh3.googleusercontent.com/a/ACg8ocKlg3EppCoq"),
    ).toBe("https://lh3.googleusercontent.com/a/ACg8ocKlg3EppCoq");
  });

  it("leaves a photo from another host untouched", () => {
    expect(avatarImageUri("https://example.com/avatar.png")).toBe(
      "https://example.com/avatar.png",
    );
  });
});
