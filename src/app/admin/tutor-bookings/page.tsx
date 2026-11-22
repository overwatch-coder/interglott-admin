import { AdminPagination } from "@/components/admin/AdminPagination";
import AdminTutorBookings from "@/app/admin/tutor-bookings/AdminTutorBookingsClient";
import { getAdminTutorBookingsPage, parsePage } from "@/lib/adminPageData.server";

export default async function AdminTutorBookingsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const page = parsePage(query.page);
  const search = typeof query.q === "string" ? query.q : "";
  const language = typeof query.language === "string" ? query.language : "all";
  const status = typeof query.status === "string" ? query.status : "all";
  const sort = typeof query.sort === "string" && ["newest", "oldest", "name_asc"].includes(query.sort) ? query.sort : "newest";
  const data = await getAdminTutorBookingsPage({ page, search, language, status, sort });

  return (
    <AdminTutorBookings
      {...data}
      search={search}
      language={language}
      status={status}
      sort={sort}
      pagination={<AdminPagination pathname="/admin/tutor-bookings" page={page} pageSize={data.pageSize} total={data.total} query={{ q: search, language, status, sort: sort !== "newest" ? sort : undefined }} />}
    />
  );
}
