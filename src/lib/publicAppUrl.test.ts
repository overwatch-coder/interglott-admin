import { afterEach, describe, expect, it } from "vitest";
import { getPublicAppUrl, getPublicDashboardUrl } from "@/lib/publicAppUrl";

describe("publicAppUrl", () => {
  const original = process.env.NEXT_PUBLIC_PUBLIC_APP_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_PUBLIC_APP_URL = original;
    }
  });

  it("falls back to https://interglott-zeta.vercel.app when unset", () => {
    delete process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
    expect(getPublicAppUrl()).toBe("https://interglott-zeta.vercel.app");
    expect(getPublicDashboardUrl()).toBe("https://interglott-zeta.vercel.app/dashboard");
  });

  it("strips trailing slashes from NEXT_PUBLIC_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_PUBLIC_APP_URL = "https://staging.interglott.com///";
    expect(getPublicAppUrl()).toBe("https://staging.interglott.com");
    expect(getPublicDashboardUrl()).toBe("https://staging.interglott.com/dashboard");
  });
});
