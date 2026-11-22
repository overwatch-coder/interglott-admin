import Admin from "@/app/admin/AdminOverviewClient";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { getAdminOverviewPage, parsePage } from "@/lib/adminPageData.server";

const tabs = ["all_leads", "contact_tickets", "bookings", "diagnostics", "users", "payments"] as const;

export default async function AdminPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const tab = typeof query.tab === "string" && tabs.includes(query.tab as (typeof tabs)[number])
    ? query.tab as (typeof tabs)[number]
    : "all_leads";
  const page = parsePage(query.page);
  const search = typeof query.q === "string" ? query.q : "";
  const statuses = tab === "payments"
    ? ["pending", "approved", "rejected"]
    : ["new", "in_review", "matched", "contacted", "converted"];
  const status = typeof query.status === "string" && statuses.includes(query.status) ? query.status : "all";
  const courses = ["tcf", "tef", "delf_dalf", "business", "other_languages", "free_resources"];
  const course = typeof query.course === "string" && courses.includes(query.course) ? query.course : "all";
  const allowedSorts = tab === "payments"
    ? ["newest", "oldest", "amount_desc", "amount_asc"]
    : tab === "contact_tickets" || tab === "users"
      ? ["newest", "oldest", "name_asc"]
      : ["newest", "oldest"];
  const defaultSort = tab === "users" ? "oldest" : "newest";
  const sort = typeof query.sort === "string" && allowedSorts.includes(query.sort) ? query.sort : defaultSort;
  const data = await getAdminOverviewPage({ tab, page, search, status, course, sort });

  return (
    <Admin
      {...data}
      search={search}
      status={status}
      course={course}
      sort={sort}
      pagination={
        <AdminPagination
          pathname="/admin"
          page={page}
          pageSize={data.pageSize}
          total={data.total}
          query={{ tab, q: search, status, course, sort: sort !== defaultSort ? sort : undefined }}
        />
      }
    />
  );
}
