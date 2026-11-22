import { describe, expect, it, vi, beforeEach } from "vitest";
import { notifyAdminOnFormSubmission } from "./adminNotificationService";
import { sendAdminNotification } from "@/app/actions/adminNotifications";

vi.mock("@/app/actions/adminNotifications", () => ({
  sendAdminNotification: vi.fn(),
}));

describe("Admin Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches form submission notification through the server action", async () => {
    vi.mocked(sendAdminNotification).mockResolvedValueOnce({ emailSent: true, recorded: true });

    const payload = {
      form_type: "tutor_booking" as const,
      sender_name: "Jane Doe",
      sender_email: "jane@example.com",
      details: {
        "Student Name": "Jane Doe",
        "Target Language": "French",
      },
    };

    const result = await notifyAdminOnFormSubmission(payload);

    expect(sendAdminNotification).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ emailSent: true, recorded: true });
  });

  it("returns safe fallback when server action throws", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(sendAdminNotification).mockRejectedValueOnce(new Error("Network error"));

    const result = await notifyAdminOnFormSubmission({
      form_type: "contact_ticket",
      sender_email: "jane@example.com",
      details: { Subject: "Help" },
    });

    expect(result).toEqual({ emailSent: false, recorded: false });
    warnSpy.mockRestore();
  });
});
