import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@thefrenchpathway.com";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parsePositiveInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return Response.json({ error: "Forbidden." }, { status: 403 });

  const url = new URL(request.url);
  const requestedPage = parsePositiveInt(url.searchParams.get("page"), 1, 1, 100_000);
  const limit = parsePositiveInt(url.searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const formType = (url.searchParams.get("formType") ?? "all").trim();

  const where = formType && formType !== "all" ? { formType } : {};
  const total = await prisma.adminNotification.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * limit;

  const notifications = total > 0
    ? await prisma.adminNotification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
      })
    : [];

  return Response.json({
    adminEmail: ADMIN_EMAIL,
    total,
    page,
    pageSize: limit,
    totalPages,
    notifications: notifications.map((row) => ({
      id: row.id,
      form_type: row.formType,
      recipient_email: row.recipientEmail,
      subject: row.subject,
      payload: row.payload,
      status: row.status,
      created_at: row.createdAt,
    })),
  });
}
