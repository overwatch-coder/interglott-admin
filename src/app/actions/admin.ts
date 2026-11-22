"use server";

import argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/serverAuth";

async function requireAdminAction() {
  const guard = await adminGuard();
  if (guard.response) return { ok: false as const, error: guard.response.status === 401 ? "Sign in required." : "Admin access required." };
  return { ok: true as const, userId: guard.session.user.id };
}

const leadUpdateSchema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "in_review", "matched", "contacted", "converted"]).optional(),
  adminNotes: z.string().max(10_000).nullable().optional(),
}).refine((value) => value.status !== undefined || value.adminNotes !== undefined);

export async function updateAdminLead(input: unknown) {
  const access = await requireAdminAction();
  if (!access.ok) return { error: access.error };
  const parsed = leadUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid lead update." };
  const { id, status, adminNotes } = parsed.data;
  const updated = await prisma.lead.updateMany({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      updatedAt: new Date(),
    },
  });
  if (!updated.count) return { error: "Lead not found." };
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  return { ok: true as const };
}

export async function updateAdminTutorBooking(input: unknown) {
  const access = await requireAdminAction();
  if (!access.ok) return { error: access.error };
  const parsed = z.object({
    id: z.uuid(),
    status: z.enum(["Pending", "In Progress", "Completed", "Cancelled"]),
  }).safeParse(input);
  if (!parsed.success) return { error: "Invalid booking update." };
  const updated = await prisma.tutorBooking.updateMany({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status, updatedAt: new Date() },
  });
  if (!updated.count) return { error: "Tutor booking not found." };
  revalidatePath("/admin");
  revalidatePath("/admin/tutor-bookings");
  return { ok: true as const };
}

const paymentStatus = z.enum(["approved", "rejected"]);
export async function decideAdminPayments(input: unknown) {
  const access = await requireAdminAction();
  if (!access.ok) return { error: access.error };
  const parsed = z.object({ ids: z.array(z.uuid()).min(1).max(25), status: paymentStatus }).safeParse(input);
  if (!parsed.success) return { error: "Invalid payment update." };

  const approved = parsed.data.status === "approved";
  const updatedCount = await prisma.$transaction(async (tx) => {
    const pendingPayments = await tx.payment.findMany({
      where: { id: { in: parsed.data.ids }, status: "pending" },
      select: { id: true, userId: true, planType: true },
    });
    if (pendingPayments.length === 0) return 0;

    const now = new Date();
    for (const payment of pendingPayments) {
      const changed = await tx.payment.updateMany({
        where: { id: payment.id, status: "pending" },
        data: { status: parsed.data.status, approvalDate: approved ? now : undefined, updatedAt: now },
      });
      if (!changed.count) continue;
      if (approved) {
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + 1);
        const credits = ({ basic_premium: 50, pro: 75, sapphire: 100 } as Record<string, number>)[payment.planType] ?? 0;
        await tx.profile.updateMany({
          where: { id: payment.userId },
          data: { planType: payment.planType, creditsBalance: credits, planStatus: "active", planStartDate: now, planExpiryDate: expiry, updatedAt: now },
        });
      }
    }
    return pendingPayments.length;
  });
  if (updatedCount === 0) return { error: "No pending payments matched this request." };
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  return { ok: true as const, updatedCount };
}

const adminUserMutation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("grant"), email: z.email().trim().toLowerCase() }),
  z.object({ action: z.literal("create"), email: z.email().trim().toLowerCase(), password: z.string().min(8).max(128), name: z.string().trim().min(1).max(200) }),
  z.object({ action: z.literal("revoke"), roleId: z.uuid() }),
]);

export async function manageAdminUser(input: unknown) {
  const access = await requireAdminAction();
  if (!access.ok) return { error: access.error };
  const parsed = adminUserMutation.safeParse(input);
  if (!parsed.success) return { error: "Invalid admin user request." };
  const data = parsed.data;

  if (data.action === "revoke") {
    const role = await prisma.userRole.findUnique({ where: { id: data.roleId } });
    if (!role) return { error: "Admin role not found." };
    if (role.userId === access.userId) return { error: "You cannot revoke your own admin access." };
    await prisma.userRole.delete({ where: { id: data.roleId } });
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    return { ok: true as const };
  }

  let user = await prisma.user.findUnique({ where: { email: data.email } });
  let created = false;
  if (data.action === "create") {
    if (user) return { error: "An account with that email already exists." };
    const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });
    user = await prisma.user.create({
      data: { email: data.email, name: data.name, passwordHash, profile: { create: { email: data.email, displayName: data.name, creditsBalance: 10 } } },
    });
    created = true;
  } else if (!user) {
    return { error: "No account exists with that email. They need to sign up first." };
  }

  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role: "admin" } },
    create: { userId: user.id, role: "admin", grantedBy: access.userId },
    update: { grantedBy: access.userId },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { ok: true as const, created, email: user.email };
}

export async function deleteAdminLead(input: unknown) {
  const access = await requireAdminAction();
  if (!access.ok) return { error: access.error };
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid lead ID." };
  const deleted = await prisma.lead.deleteMany({ where: { id: parsed.data.id } });
  if (!deleted.count) return { error: "Lead not found." };
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  return { ok: true as const };
}

export async function deleteAdminContactTicket(input: unknown) {
  const access = await requireAdminAction();
  if (!access.ok) return { error: access.error };
  const parsed = z.object({ id: z.string().trim().min(1).max(60) }).safeParse(input);
  if (!parsed.success) return { error: "Invalid contact submission ID." };
  const deleted = await prisma.contactSubmission.deleteMany({ where: { id: parsed.data.id } });
  if (!deleted.count) return { error: "Contact submission not found." };
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function deleteAdminLearner(input: unknown) {
  const access = await requireAdminAction();
  if (!access.ok) return { error: access.error };
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid learner ID." };
  const deleted = await prisma.learner.deleteMany({ where: { id: parsed.data.id } });
  if (!deleted.count) return { error: "Learner not found." };
  revalidatePath("/admin");
  revalidatePath("/admin/learners");
  return { ok: true as const };
}

export async function deleteAdminTutorBooking(input: unknown) {
  const access = await requireAdminAction();
  if (!access.ok) return { error: access.error };
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid booking ID." };
  const deleted = await prisma.tutorBooking.deleteMany({ where: { id: parsed.data.id } });
  if (!deleted.count) return { error: "Tutor booking not found." };
  revalidatePath("/admin");
  revalidatePath("/admin/tutor-bookings");
  return { ok: true as const };
}

export async function deleteAdminPayment(input: unknown) {
  const access = await requireAdminAction();
  if (!access.ok) return { error: access.error };
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid payment ID." };
  const deleted = await prisma.payment.deleteMany({ where: { id: parsed.data.id } });
  if (!deleted.count) return { error: "Payment record not found." };
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  return { ok: true as const };
}
