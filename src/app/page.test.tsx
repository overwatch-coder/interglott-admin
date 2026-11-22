import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const currentSessionMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("@/lib/serverAuth", () => ({
  currentSession: () => currentSessionMock(),
}));

import HomePage from "@/app/page";

describe("HomePage root redirect", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    currentSessionMock.mockReset();
  });

  it("redirects unauthenticated visitors to /admin/login", async () => {
    currentSessionMock.mockResolvedValue(null);
    await expect(HomePage()).rejects.toThrow("REDIRECT:/admin/login");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("redirects non-admin users to /admin/login", async () => {
    currentSessionMock.mockResolvedValue({ user: { id: "u1", role: "user" } });
    await expect(HomePage()).rejects.toThrow("REDIRECT:/admin/login");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("redirects authenticated admins to /admin", async () => {
    currentSessionMock.mockResolvedValue({ user: { id: "a1", role: "admin" } });
    await expect(HomePage()).rejects.toThrow("REDIRECT:/admin");
    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });
});
