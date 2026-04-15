"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterState {
  [key: string]: string | number | null | undefined;
}

/**
 * Hook for syncing filter state with URL query params.
 * Source of truth: URL params. Component state mirrors for reactive UX.
 */
export function useFilterSync<T extends FilterState>(
  initialFilters: T,
): [T, (updates: Partial<T>) => void, () => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current URL params into filter state
  const filters = useMemo(() => {
    const result: Record<string, any> = { ...initialFilters };
    const keys = Object.keys(initialFilters);

    keys.forEach((key) => {
      const param = searchParams.get(key);
      if (param === null) return; // Not in URL, use initial

      // Type conversion based on initial value type
      const initialValue = initialFilters[key];
      if (initialValue === null || initialValue === undefined) {
        result[key] = param || null;
      } else if (typeof initialValue === "number") {
        result[key] = param === "" ? null : Number(param);
      } else {
        result[key] = param === "" ? null : param;
      }
    });

    return result as T;
  }, [searchParams, initialFilters]);

  // Update URL and state
  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const next = { ...filters, ...updates };
      const params = new URLSearchParams();

      Object.entries(next).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          params.set(key, String(value));
        }
      });

      const qs = params.toString();
      router.push(qs ? `?${qs}` : window.location.pathname);
    },
    [filters, router],
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    router.push(window.location.pathname);
  }, [router]);

  return [filters, setFilters, clearAllFilters];
}
