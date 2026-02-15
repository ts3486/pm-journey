import { describe, expect, it } from "vitest";
import { router } from "@/routes";

describe("router", () => {
  it("registers all core app routes including monetization paths", () => {
    const rootRoute = router.routes[0] as { children?: Array<{ path?: string }> };
    const childPaths = (rootRoute.children ?? []).map((route) => route.path ?? "(index)");

    expect(childPaths).toContain("(index)");
    expect(childPaths).toContain("history");
    expect(childPaths).toContain("history/:sessionId");
    expect(childPaths).toContain("scenario");
    expect(childPaths).toContain("settings");
    expect(childPaths).toContain("settings/account");
    expect(childPaths).toContain("settings/billing");
    expect(childPaths).toContain("settings/team");
    expect(childPaths).toContain("pricing");
    expect(childPaths).toContain("team/onboarding");
  });
});
