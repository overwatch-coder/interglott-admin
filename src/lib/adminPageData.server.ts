import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { KYCFormData, LeadStatus } from "@/types/kyc";
import type { AdminTab, AdminUserItem, ContactTicketItem, LeadItem, PaymentItem } from "@/app/admin/AdminOverviewClient";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/serverAuth";

export const ADMIN_PAGE_SIZE = 25;

export function parsePage(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 100_000) : 1;
}

export async function requireAdminPage() {
  const guard = await adminGuard();
  if (guard.response) {
    redirect(guard.response.status === 401 ? "/admin/login" : "/admin/login?error=access");
  }
  return guard.session;
}

export async function getAdminLearnersPage({ page, search, language, sort = "newest" }: {
  page: number;
  search: string;
  language: string;
  sort?: string;
}) {
  await requireAdminPage();
  const query = search.trim().slice(0, 120);
  const learnerNotAdmin: Prisma.LearnerWhereInput = {
    OR: [
      { userId: null },
      { user: { is: { roles: { none: { role: "admin" } } } } },
    ],
  };
  const where = {
    AND: [
      learnerNotAdmin,
      ...(language !== "all" ? [{ targetLanguages: { has: language } }] : []),
      ...(query ? [{ OR: [
        { firstName: { contains: query, mode: "insensitive" as const } },
        { lastName: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
        { phoneNumber: { contains: query, mode: "insensitive" as const } },
      ] }] : []),
    ],
  };
  const orderBy: Prisma.LearnerOrderByWithRelationInput[] =
    sort === "oldest"
      ? [{ createdAt: "asc" }]
      : sort === "name_asc"
        ? [{ firstName: "asc" }, { lastName: "asc" }]
        : [{ createdAt: "desc" }];
  const skip = (page - 1) * ADMIN_PAGE_SIZE;
  const [total, rows, totalRegistered, french, germanSpanish, chineseArabic] = await Promise.all([
    prisma.learner.count({ where }),
    prisma.learner.findMany({ where, orderBy, skip, take: ADMIN_PAGE_SIZE }),
    prisma.learner.count({ where: learnerNotAdmin }),
    prisma.learner.count({ where: { AND: [learnerNotAdmin, { targetLanguages: { has: "French" } }] } }),
    prisma.learner.count({ where: { AND: [learnerNotAdmin, { targetLanguages: { hasSome: ["German", "Spanish"] } }] } }),
    prisma.learner.count({ where: { AND: [learnerNotAdmin, { targetLanguages: { hasSome: ["Chinese", "Arabic"] } }] } }),
  ]);
  return {
    rows: rows.map((learner) => ({
      id: learner.id,
      user_id: learner.userId,
      first_name: learner.firstName,
      last_name: learner.lastName,
      email: learner.email,
      phone_number: learner.phoneNumber,
      country_code: learner.countryCode,
      target_languages: learner.targetLanguages,
      created_at: learner.createdAt?.toISOString() ?? "",
    })),
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    metrics: { totalRegistered, french, germanSpanish, chineseArabic },
  };
}

export async function getAdminTutorBookingsPage({ page, search, language, status, sort = "newest" }: {
  page: number;
  search: string;
  language: string;
  status: string;
  sort?: string;
}) {
  await requireAdminPage();
  const query = search.trim().slice(0, 120);
  const where = {
    ...(status !== "all" ? { status } : {}),
    ...(language !== "all" ? { languageToLearn: language } : {}),
    ...(query ? { OR: [
      { fullName: { contains: query, mode: "insensitive" as const } },
      { email: { contains: query, mode: "insensitive" as const } },
      { languageToLearn: { contains: query, mode: "insensitive" as const } },
    ] } : {}),
  };
  const orderBy: Prisma.TutorBookingOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "name_asc"
        ? { fullName: "asc" }
        : { createdAt: "desc" };
  const skip = (page - 1) * ADMIN_PAGE_SIZE;
  const [total, rows, totalBookings, pending, inProgress, completed] = await Promise.all([
    prisma.tutorBooking.count({ where }),
    prisma.tutorBooking.findMany({ where, orderBy, skip, take: ADMIN_PAGE_SIZE }),
    prisma.tutorBooking.count(),
    prisma.tutorBooking.count({ where: { status: "Pending" } }),
    prisma.tutorBooking.count({ where: { status: "In Progress" } }),
    prisma.tutorBooking.count({ where: { status: "Completed" } }),
  ]);
  return {
    rows: rows.map((booking) => ({
      ...booking,
      user_id: booking.userId,
      full_name: booking.fullName,
      country_of_residence: booking.countryOfResidence,
      language_to_learn: booking.languageToLearn,
      specific_tutor: booking.specificTutor,
      session_format: booking.sessionFormat,
      current_level: booking.currentLevel,
      primary_goal: booking.primaryGoal,
      focus_areas: booking.focusAreas,
      time_commitment: booking.timeCommitment,
      preferred_days: booking.preferredDays,
      preferred_time: booking.preferredTime,
      session_length: booking.sessionLength,
      budget_per_hour: booking.budgetPerHour,
      special_needs: booking.specialNeeds,
      referral_source: booking.referralSource,
      status: (booking.status === "In Progress" || booking.status === "Completed" || booking.status === "Cancelled" ? booking.status : "Pending") as "Pending" | "In Progress" | "Completed" | "Cancelled",
      created_at: booking.createdAt?.toISOString() ?? "",
      updated_at: booking.updatedAt?.toISOString() ?? "",
    })),
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    metrics: { totalBookings, pending, inProgress, completed },
  };
}

export async function getAdminPaymentsPage({ page, search, status, sort = "newest" }: {
  page: number;
  search: string;
  status: string;
  sort?: string;
}) {
  await requireAdminPage();
  const query = search.trim().slice(0, 120);
  const isUuidQuery = z.uuid().safeParse(query).success;
  const where: Prisma.PaymentWhereInput = {
    ...(status !== "all" ? { status } : {}),
    ...(query ? { OR: [
      { userEmail: { contains: query, mode: "insensitive" as const } },
      { transactionId: { contains: query, mode: "insensitive" as const } },
      ...(isUuidQuery ? [{ userId: query }] : []),
      { planType: { contains: query, mode: "insensitive" as const } },
    ] } : {}),
  };
  const orderBy: Prisma.PaymentOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "amount_desc"
        ? { amount: "desc" }
        : sort === "amount_asc"
          ? { amount: "asc" }
          : { createdAt: "desc" };
  const skip = (page - 1) * ADMIN_PAGE_SIZE;
  const [total, rows, pending, approved, rejected] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({ where, orderBy, skip, take: ADMIN_PAGE_SIZE }),
    prisma.payment.count({ where: { status: "pending" } }),
    prisma.payment.count({ where: { status: "approved" } }),
    prisma.payment.count({ where: { status: "rejected" } }),
  ]);
  return {
    rows: rows.map((payment) => ({
      id: payment.id,
      user_id: payment.userId,
      user_email: payment.userEmail,
      plan_type: payment.planType,
      amount: Number(payment.amount),
      currency: payment.currency,
      transaction_id: payment.transactionId,
      status: payment.status,
      payment_date: payment.paymentDate.toISOString(),
      approval_date: payment.approvalDate?.toISOString() ?? null,
      admin_notes: payment.adminNotes,
    })),
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    metrics: { pending, approved, rejected },
  };
}

export async function getAdminUsersPage({ page, search, sort = "oldest" }: { page: number; search: string; sort?: string }) {
  await requireAdminPage();
  const query = search.trim().slice(0, 120);
  const where = {
    role: "admin" as const,
    ...(query ? { user: { OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { email: { contains: query, mode: "insensitive" as const } },
      { profile: { is: { displayName: { contains: query, mode: "insensitive" as const } } } },
    ] } } : {}),
  };
  const orderBy: Prisma.UserRoleOrderByWithRelationInput =
    sort === "newest"
      ? { createdAt: "desc" }
      : sort === "name_asc"
        ? { user: { name: "asc" } }
        : { createdAt: "asc" };
  const [total, rows] = await Promise.all([
    prisma.userRole.count({ where }),
    prisma.userRole.findMany({ where, include: { user: { include: { profile: true } } }, orderBy, skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE }),
  ]);
  const grantorIds = [...new Set(rows.map((row) => row.grantedBy).filter((id): id is string => Boolean(id)))];
  const grantors = grantorIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: grantorIds } }, select: { id: true, email: true } })
    : [];
  const grantorEmailById = new Map(grantors.map((grantor) => [grantor.id, grantor.email]));
  return {
    rows: rows.map((row) => ({
      id: row.id,
      user_id: row.userId,
      created_at: row.createdAt.toISOString(),
      granted_by: row.grantedBy,
      email: row.user.email,
      display_name: row.user.profile?.displayName ?? row.user.name,
      granted_by_email: row.grantedBy ? grantorEmailById.get(row.grantedBy) ?? null : null,
      role: "admin" as const,
    })),
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
  };
}

const bookingLeadTypes = ["clarity_call_booking", "tutor_booking_request"];
const diagnosticLeadType = "diagnostic_placement_test";

const bookingWhere: Prisma.LeadWhereInput = {
  OR: bookingLeadTypes.map((type) => ({ formData: { path: ["type"], equals: type } })),
};

const diagnosticWhere: Prisma.LeadWhereInput = {
  OR: [
    { formData: { path: ["type"], equals: diagnosticLeadType } },
    { AND: [
      { formData: { path: ["estimated_cefr_level"], not: Prisma.AnyNull } },
      { formData: { path: ["estimated_cefr_level"], not: "" } },
    ] },
  ],
};

const surveyWhere: Prisma.LeadWhereInput = {
  AND: [
    { OR: [
      { formData: { path: ["type"], equals: Prisma.AnyNull } },
      { AND: [
        { formData: { path: ["type"], not: bookingLeadTypes[0] } },
        { formData: { path: ["type"], not: bookingLeadTypes[1] } },
        { formData: { path: ["type"], not: diagnosticLeadType } },
      ] },
    ] },
    { OR: [
      { formData: { path: ["estimated_cefr_level"], equals: Prisma.AnyNull } },
      { formData: { path: ["estimated_cefr_level"], equals: "" } },
    ] },
  ],
};

export async function getAdminLeadsPage({ page, search, status, course, sort = "newest" }: {
  page: number;
  search: string;
  status: string;
  course: string;
  sort?: string;
}) {
  await requireAdminPage();
  const query = search.trim().slice(0, 120);
  const where: Prisma.LeadWhereInput = {
    AND: [
      surveyWhere,
      ...(status !== "all" ? [{ status }] : []),
      ...(course !== "all" ? [{ courseSelected: course }] : []),
      ...(query ? [{ OR: [
        { formData: { path: ["demographics", "fullName"], string_contains: query, mode: "insensitive" as const } },
        { formData: { path: ["demographics", "email"], string_contains: query, mode: "insensitive" as const } },
        { formData: { path: ["full_name"], string_contains: query, mode: "insensitive" as const } },
        { formData: { path: ["email"], string_contains: query, mode: "insensitive" as const } },
      ] }] : []),
    ],
  };
  const orderBy: Prisma.LeadOrderByWithRelationInput = sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };
  const [total, rows] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({ where, orderBy, skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE }),
  ]);
  return {
    rows: rows.map((lead) => ({
      id: lead.id,
      user_id: lead.userId ?? null,
      form_data: lead.formData as unknown as KYCFormData,
      course_selected: lead.courseSelected ?? "",
      status: (lead.status && ["new", "in_review", "matched", "contacted", "converted"].includes(lead.status) ? lead.status : "new") as LeadStatus,
      admin_notes: lead.adminNotes ?? null,
      matched_tutor_id: lead.matchedTutorId ?? null,
      created_at: lead.createdAt?.toISOString() ?? "",
      updated_at: lead.updatedAt?.toISOString() ?? "",
    })),
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
  };
}

export async function getAdminOverviewPage({
  tab,
  page,
  search,
  status,
  course,
  sort = "newest",
}: {
  tab: AdminTab;
  page: number;
  search: string;
  status: string;
  course: string;
  sort?: string;
}) {
  await requireAdminPage();
  const query = search.trim().slice(0, 120);
  const skip = (page - 1) * ADMIN_PAGE_SIZE;
  const leadSearch: Prisma.LeadWhereInput = query ? {
    OR: [
      { formData: { path: ["demographics", "fullName"], string_contains: query, mode: "insensitive" } },
      { formData: { path: ["demographics", "email"], string_contains: query, mode: "insensitive" } },
      { formData: { path: ["full_name"], string_contains: query, mode: "insensitive" } },
      { formData: { path: ["email"], string_contains: query, mode: "insensitive" } },
    ],
  } : {};
  const selectedLeadWhere = tab === "bookings" ? bookingWhere : tab === "diagnostics" ? diagnosticWhere : surveyWhere;
  const tabLeadWhere: Prisma.LeadWhereInput = {
    AND: [selectedLeadWhere, leadSearch, ...(status !== "all" ? [{ status }] : []), ...(course !== "all" ? [{ courseSelected: course }] : [])],
  };

  const [surveyCount, bookingCount, diagnosticCount, contactCount, adminCount, paymentCount] = await Promise.all([
    prisma.lead.count({ where: surveyWhere }),
    prisma.lead.count({ where: bookingWhere }),
    prisma.lead.count({ where: diagnosticWhere }),
    prisma.contactSubmission.count(),
    prisma.userRole.count({ where: { role: "admin" } }),
    prisma.payment.count(),
  ]);

  let total = 0;
  let rows: (LeadItem | ContactTicketItem | AdminUserItem | PaymentItem)[] = [];
  if (["all_leads", "bookings", "diagnostics"].includes(tab)) {
    const orderBy: Prisma.LeadOrderByWithRelationInput = sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };
    const [count, leads] = await Promise.all([
      prisma.lead.count({ where: tabLeadWhere }),
      prisma.lead.findMany({ where: tabLeadWhere, orderBy, skip, take: ADMIN_PAGE_SIZE }),
    ]);
    total = count;
    rows = leads.map((lead) => ({
      id: lead.id,
      user_id: lead.userId ?? undefined,
      form_data: lead.formData as unknown as KYCFormData,
      course_selected: lead.courseSelected ?? undefined,
      status: (lead.status && ["new", "in_review", "matched", "contacted", "converted"].includes(lead.status) ? lead.status : "new") as LeadStatus,
      admin_notes: lead.adminNotes ?? undefined,
      matched_tutor_id: lead.matchedTutorId ?? undefined,
      created_at: lead.createdAt?.toISOString() ?? "",
      updated_at: lead.updatedAt?.toISOString(),
    }));
  } else if (tab === "contact_tickets") {
    const where = query ? { OR: [
      { id: { contains: query, mode: "insensitive" as const } },
      { name: { contains: query, mode: "insensitive" as const } },
      { email: { contains: query, mode: "insensitive" as const } },
      { phone: { contains: query, mode: "insensitive" as const } },
      { subject: { contains: query, mode: "insensitive" as const } },
      { supportCategory: { contains: query, mode: "insensitive" as const } },
      { orgName: { contains: query, mode: "insensitive" as const } },
    ] } : {};
    const orderBy: Prisma.ContactSubmissionOrderByWithRelationInput =
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "name_asc"
          ? { name: "asc" }
          : { createdAt: "desc" };
    const [count, submissions] = await Promise.all([
      prisma.contactSubmission.count({ where }),
      prisma.contactSubmission.findMany({ where, orderBy, skip, take: ADMIN_PAGE_SIZE }),
    ]);
    total = count;
    rows = submissions.map((row) => ({
      id: row.id, path: row.path ?? undefined, name: row.name, email: row.email, phone: row.phone ?? undefined,
      support_category: row.supportCategory ?? undefined, support_description: row.supportDescription ?? undefined,
      attachment_name: row.attachmentName ?? undefined, subject: row.subject ?? undefined,
      general_message: row.generalMessage ?? undefined, referral_source: row.referralSource ?? undefined,
      org_name: row.orgName ?? undefined, org_website: row.orgWebsite ?? undefined,
      partnership_details: row.partnershipDetails ?? undefined, something_else: row.somethingElse ?? undefined,
      created_at: row.createdAt?.toISOString() ?? "",
    }));
  } else if (tab === "users") {
    const data = await getAdminUsersPage({ page, search: query, sort });
    total = data.total;
    rows = data.rows;
  } else {
    const data = await getAdminPaymentsPage({ page, search: query, status: status === "all" ? "all" : status, sort });
    total = data.total;
    rows = data.rows.map((payment) => ({ ...payment, created_at: payment.payment_date }));
  }

  return {
    tab,
    rows,
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    counts: { all_leads: surveyCount, contact_tickets: contactCount, bookings: bookingCount, diagnostics: diagnosticCount, users: adminCount, payments: paymentCount },
  };
}
