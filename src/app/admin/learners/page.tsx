import { AdminPagination } from "@/components/admin/AdminPagination";
import AdminLearners from "@/app/admin/learners/AdminLearnersClient";
import { getAdminLearnersPage, parsePage } from "@/lib/adminPageData.server";

export default async function AdminLearnersPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const page = parsePage(query.page);
  const search = typeof query.q === "string" ? query.q : "";
  const language = typeof query.language === "string" ? query.language : "all";
  const sort = typeof query.sort === "string" && ["newest", "oldest", "name_asc"].includes(query.sort) ? query.sort : "newest";
  const data = await getAdminLearnersPage({ page, search, language, sort });

  return (
    <AdminLearners
      {...data}
      search={search}
      language={language}
      sort={sort}
      pagination={<AdminPagination pathname="/admin/learners" page={page} pageSize={data.pageSize} total={data.total} query={{ q: search, language, sort: sort !== "newest" ? sort : undefined }} />}
    />
  );
}
