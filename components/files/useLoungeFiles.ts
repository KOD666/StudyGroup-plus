"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LoungeFileItem,
  FilesPaginationMeta,
  FileTypeFilter,
  FileSortOption,
} from "./types";

export function useLoungeFiles(groupId: string) {
  const [files, setFiles] = useState<LoungeFileItem[]>([]);
  const [pagination, setPagination] = useState<FilesPaginationMeta>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
  const [sortBy, setSortBy] = useState<FileSortOption>("newest");
  const [page, setPage] = useState(1);

  // Debounce search input by 300ms
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [search]);

  const fetchFiles = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        sort: sortBy,
      });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/groups/${groupId}/files?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load files");
      }

      const data = await res.json();
      setFiles(data.files || []);
      setPagination(
        data.pagination || { page: 1, pageSize: 25, total: 0, totalPages: 1 }
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, page, sortBy, debouncedSearch, typeFilter]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    pagination,
    isLoading,
    error,
    search,
    setSearch,
    typeFilter,
    setTypeFilter: (tf: FileTypeFilter) => {
      setTypeFilter(tf);
      setPage(1);
    },
    sortBy,
    setSortBy: (sb: FileSortOption) => {
      setSortBy(sb);
      setPage(1);
    },
    page,
    setPage,
    reload: fetchFiles,
  };
}
