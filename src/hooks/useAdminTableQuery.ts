"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function useAdminTableQuery({
  pathname,
  initialSearch,
  params,
  defaultSort = "newest",
  debounceMs = 300,
}: {
  pathname: string;
  initialSearch: string;
  params: Record<string, string | undefined>;
  defaultSort?: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  const navigate = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const merged: Record<string, string | undefined> = {
        ...paramsRef.current,
        ...overrides,
      };
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(merged)) {
        if (!value || value === "all") continue;
        if (key === "sort" && value === defaultSort) continue;
        if (key === "page") continue;
        qs.set(key, value);
      }
      const queryString = qs.toString();
      const target = queryString ? `${pathname}?${queryString}` : pathname;
      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    },
    [defaultSort, pathname, router],
  );

  useEffect(() => {
    if (searchValue === initialSearch) return;
    const timer = window.setTimeout(() => {
      navigate({ q: searchValue.trim() || undefined });
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [searchValue, initialSearch, debounceMs, navigate]);

  const setFilter = useCallback(
    (key: string, value: string) => {
      navigate({ q: searchValue.trim() || undefined, [key]: value });
    },
    [navigate, searchValue],
  );

  const clearSearch = useCallback(() => {
    setSearchValue("");
    navigate({ q: undefined });
  }, [navigate]);

  return { searchValue, setSearchValue, clearSearch, setFilter, isPending };
}
