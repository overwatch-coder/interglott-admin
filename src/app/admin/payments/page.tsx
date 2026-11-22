import { AdminPagination } from "@/components/admin/AdminPagination";
import AdminPayments from "@/app/admin/payments/AdminPaymentsClient";
import { getAdminPaymentsPage, parsePage } from "@/lib/adminPageData.server";

export default async function AdminPaymentsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const page = parsePage(query.page);
  const search = typeof query.q === "string" ? query.q : "";
  const status = typeof query.status === "string" && ["pending", "approved", "rejected"].includes(query.status) ? query.status : "pending";
  const sort = typeof query.sort === "string" && ["newest", "oldest", "amount_desc", "amount_asc"].includes(query.sort) ? query.sort : "newest";
  const data = await getAdminPaymentsPage({ page, search, status, sort });

  return (
    <AdminPayments
      {...data}
      search={search}
      status={status as "pending" | "approved" | "rejected"}
      sort={sort}
      pagination={<AdminPagination pathname="/admin/payments" page={page} pageSize={data.pageSize} total={data.total} query={{ q: search, status, sort: sort !== "newest" ? sort : undefined }} />}
    />
  );
}
