import { describe, expect, it } from "bun:test";
import {
  attemptGoogleSignIn,
  authErrorMessage,
  GENERIC_AUTH_ERROR,
} from "./auth-error";

describe("authErrorMessage", () => {
  it("maps known OAuth codes to friendly copy", () => {
    expect(authErrorMessage("access_denied")).toContain("cancelled");
    expect(authErrorMessage("state_mismatch")).toContain("expired");
  });

  it("stays generic for unknown codes and missing codes", () => {
    expect(authErrorMessage("some_weird_provider_code")).toBe(GENERIC_AUTH_ERROR);
    expect(authErrorMessage(null)).toBe(GENERIC_AUTH_ERROR);
    expect(authErrorMessage()).toBe(GENERIC_AUTH_ERROR);
  });
});

describe("attemptGoogleSignIn", () => {
  it("reports success without a message", async () => {
    const result = await attemptGoogleSignIn(async () => {});

    expect(result.ok).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("keeps a rejected sign-in on the screen with a message", async () => {
    const result = await attemptGoogleSignIn(async () => {
      throw new Error("Network down");
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Network down");
  });

  it("uses generic copy for non-Error rejections", async () => {
    const result = await attemptGoogleSignIn(async () => {
      throw "oops";
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe(GENERIC_AUTH_ERROR);
  });
});
