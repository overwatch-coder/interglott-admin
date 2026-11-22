import { AdminPagination } from "@/components/admin/AdminPagination";
import AdminLeads from "@/app/admin/leads/AdminLeadsClient";
import { getAdminLeadsPage, parsePage } from "@/lib/adminPageData.server";

export default async function AdminLeadsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const page = parsePage(query.page);
  const search = typeof query.q === "string" ? query.q : "";
  const statuses = ["new", "in_review", "matched", "contacted", "converted"];
  const status = typeof query.status === "string" && statuses.includes(query.status) ? query.status : "all";
  const course = typeof query.course === "string" ? query.course : "all";
  const sort = typeof query.sort === "string" && ["newest", "oldest"].includes(query.sort) ? query.sort : "newest";
  const data = await getAdminLeadsPage({ page, search, status, course, sort });

  return (
    <AdminLeads
      {...data}
      search={search}
      status={status}
      course={course}
      sort={sort}
      pagination={<AdminPagination pathname="/admin/leads" page={page} pageSize={data.pageSize} total={data.total} query={{ q: search, status, course, sort: sort !== "newest" ? sort : undefined }} />}
    />
  );
}
