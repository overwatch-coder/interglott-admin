import { AdminPagination } from "@/components/admin/AdminPagination";
import AdminUsers from "@/app/admin/users/AdminUsersClient";
import { getAdminUsersPage, parsePage } from "@/lib/adminPageData.server";

export default async function AdminUsersPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const page = parsePage(query.page);
  const search = typeof query.q === "string" ? query.q : "";
  const sort = typeof query.sort === "string" && ["oldest", "newest", "name_asc"].includes(query.sort) ? query.sort : "oldest";
  const data = await getAdminUsersPage({ page, search, sort });

  return (
    <AdminUsers
      {...data}
      search={search}
      sort={sort}
      pagination={<AdminPagination pathname="/admin/users" page={page} pageSize={data.pageSize} total={data.total} query={{ q: search, sort: sort !== "oldest" ? sort : undefined }} />}
    />
  );
}
