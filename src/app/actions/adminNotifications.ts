"use server";

import type { Prisma } from "@/generated/prisma/client";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const notificationSchema = z.object({
  form_type: z.enum(["tutor_booking", "learner_signup", "contact_ticket", "intake_lead", "call_booking"]),
  sender_name: z.string().trim().max(200).optional(),
  sender_email: z.email().max(320).optional(),
  recipient_email: z.email().max(320).optional(),
  custom_subject: z.string().trim().max(300).optional(),
  details: z.record(z.string().max(100), z.json()).refine((data) => Object.keys(data).length <= 50),
});

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@thefrenchpathway.com";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

function escapeHtml(value: unknown): string {
  const text = Array.isArray(value) ? value.join(", ") : String(value ?? "N/A");
  return text.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

export async function sendAdminNotification(input: unknown) {
  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) return { emailSent: false, recorded: false };

  const { form_type, sender_name, sender_email, details, custom_subject } = parsed.data;
  const session = await getServerSession(authOptions);
  const recipientEmail = session?.user?.role === "admin" && parsed.data.recipient_email
    ? parsed.data.recipient_email
    : ADMIN_EMAIL;
  const sender = sender_name ? `${sender_name} (${sender_email ?? ""})` : sender_email ?? "Anonymous User";
  const subject = custom_subject || `[NEW ALERT] ${form_type.replace(/_/g, " ").toUpperCase()} received from ${sender}`;
  const notification = await prisma.adminNotification.create({
    data: { formType: form_type, recipientEmail, subject, payload: details as Prisma.InputJsonObject, status: "logged" },
  });

  if (!process.env.RESEND_API_KEY) return { emailSent: false, recorded: true };
  if (!RESEND_FROM_EMAIL) {
    await prisma.adminNotification.update({ where: { id: notification.id }, data: { status: "failed" } });
    return { emailSent: false, recorded: true };
  }

  const rows = Object.entries(details)
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`)
    .join("");
  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [recipientEmail],
        subject,
        html: `<h2>Interglott Admin Alert</h2><table>${rows}</table>`,
      }),
    });
    await prisma.adminNotification.update({
      where: { id: notification.id },
      data: { status: emailResponse.ok ? "sent" : "failed" },
    });
    return { emailSent: emailResponse.ok, recorded: true };
  } catch {
    await prisma.adminNotification.update({ where: { id: notification.id }, data: { status: "failed" } });
    return { emailSent: false, recorded: true };
  }
}
