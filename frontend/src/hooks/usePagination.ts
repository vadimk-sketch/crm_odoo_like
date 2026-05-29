import { useState, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  offset: number;
  setPage: (page: number) => void;
  totalPages: (totalCount: number) => number;
  reset: () => void;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, pageSize = 25 } = options;
  const [page, setPage] = useState(initialPage);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const totalPages = (totalCount: number) => Math.max(1, Math.ceil(totalCount / pageSize));

  const reset = () => setPage(1);

  return { page, pageSize, offset, setPage, totalPages, reset };
}
