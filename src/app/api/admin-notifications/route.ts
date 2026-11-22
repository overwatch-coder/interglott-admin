import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@thefrenchpathway.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return Response.json({ error: "Forbidden." }, { status: 403 });

  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ adminEmail: ADMIN_EMAIL, notifications: notifications.map((row) => ({
    id: row.id,
    form_type: row.formType,
    recipient_email: row.recipientEmail,
    subject: row.subject,
    payload: row.payload,
    status: row.status,
    created_at: row.createdAt,
  })) });
}
