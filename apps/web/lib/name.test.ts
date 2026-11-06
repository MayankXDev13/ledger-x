import { describe, expect, it } from "bun:test";
import { avatarInitials, deriveFirstName } from "./name";

describe("deriveFirstName", () => {
  it("returns the first whitespace token of the name", () => {
    expect(deriveFirstName("Mayank Kumar Singh", "mayank@example.com")).toBe(
      "Mayank",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(deriveFirstName("  Mayank  Kumar", "m@example.com")).toBe("Mayank");
  });

  it("falls back to the email local-part when name is missing", () => {
    expect(deriveFirstName(null, "user@example.com")).toBe("user");
    expect(deriveFirstName("", "user@example.com")).toBe("user");
    expect(deriveFirstName("   ", "user@example.com")).toBe("user");
  });

  it("falls back to the neutral label when name and email are empty", () => {
    expect(deriveFirstName(null, null)).toBe("Account");
    expect(deriveFirstName(null, "")).toBe("Account");
    expect(deriveFirstName(null, "   @example.com")).toBe("Account");
  });
});

describe("avatarInitials", () => {
  it("uppercases the first two email characters", () => {
    expect(avatarInitials("user@example.com")).toBe("US");
  });

  it("falls back to LX without an email", () => {
    expect(avatarInitials(null)).toBe("LX");
    expect(avatarInitials("")).toBe("LX");
  });
});
