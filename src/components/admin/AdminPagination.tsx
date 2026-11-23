import Link from "next/link";

interface AdminPaginationProps {
  pathname: string;
  page: number;
  pageSize: number;
  total: number;
  query?: Record<string, string | undefined>;
}

export function AdminPagination({ pathname, page, pageSize, total, query = {} }: AdminPaginationProps) {
  if (total <= 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);

  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...query, page: String(nextPage) })) {
      if (value) params.set(key, value);
    }
    return `${pathname}?${params.toString()}`;
  };

  const rangeStart = Math.min((safePage - 1) * pageSize + 1, total);
  const rangeEnd = Math.min(safePage * pageSize, total);

  return (
    <nav aria-label="Table pages" className="flex flex-col gap-2 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">
        Showing {rangeStart}–{rangeEnd} of {total}
      </span>
      {pages > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {safePage > 1 ? (
            <Link href={href(safePage - 1)} className="inline-flex h-9 items-center rounded-md border border-border px-3 hover:bg-secondary">Previous</Link>
          ) : (
            <span className="inline-flex h-9 items-center rounded-md border border-border px-3 text-muted-foreground/60">Previous</span>
          )}
          <span className="px-1 text-muted-foreground">Page {safePage} of {pages}</span>
          {safePage < pages ? (
            <Link href={href(safePage + 1)} className="inline-flex h-9 items-center rounded-md border border-border px-3 hover:bg-secondary">Next</Link>
          ) : (
            <span className="inline-flex h-9 items-center rounded-md border border-border px-3 text-muted-foreground/60">Next</span>
          )}
        </div>
      )}
    </nav>
  );
}
