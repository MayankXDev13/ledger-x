import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthErrorBanner } from "./AuthErrorBanner";

describe("AuthErrorBanner", () => {
  it("shows readable copy and a retry action for a known error code", () => {
    const html = renderToStaticMarkup(
      <AuthErrorBanner code="state_mismatch" onRetry={() => {}} />,
    );

    expect(html).toContain("role=\"alert\"");
    expect(html).toContain("expired");
    expect(html).toContain("Try again");
  });

  it("never renders raw provider error descriptions", () => {
    const html = renderToStaticMarkup(
      <AuthErrorBanner
        code="unexpected_code"
        onRetry={() => {}}
      />,
    );

    expect(html).toContain("We couldn&#x27;t sign you in");
    expect(html).not.toContain("oauth_provider_not_found");
  });

  it("uses generic copy when no code is present", () => {
    const html = renderToStaticMarkup(
      <AuthErrorBanner onRetry={() => {}} />,
    );

    expect(html).toContain("We couldn&#x27;t sign you in");
    expect(html).toContain("Try again");
  });
});
