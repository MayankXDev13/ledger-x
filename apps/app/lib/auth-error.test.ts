import { describe, expect, it } from "bun:test";
import { attemptMobileSignIn, GENERIC_SIGN_IN_ERROR } from "./auth-error";

describe("attemptMobileSignIn", () => {
  it("returns the user on success so the screen can navigate", async () => {
    const user = { id: "user-1" };
    const result = await attemptMobileSignIn(async () => user);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user).toBe(user);
  });

  it("reports a rejection so the login screen stays put with feedback", async () => {
    const result = await attemptMobileSignIn(async () => {
      throw new Error("Browser sign-in was cancelled");
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("Browser sign-in was cancelled");
  });

  it("uses generic copy for non-Error rejections", async () => {
    const result = await attemptMobileSignIn(async () => {
      throw "oops";
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe(GENERIC_SIGN_IN_ERROR);
  });
});
