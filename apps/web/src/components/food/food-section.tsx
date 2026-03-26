"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryFilter } from "./category-filter";
import { FoodGrid } from "./food-grid";
import { AddToCartButton } from "./add-to-cart-button";
import type { Food, FoodCategory, FoodListResponse } from "@/types/food";

type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  name_asc: "Name: A–Z",
};

interface FoodSectionProps {
  initialFoods: Food[];
}

async function fetchFoods(params: {
  q?: string;
  category?: string;
  sortBy?: string;
}): Promise<Food[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.sortBy && params.sortBy !== "newest") qs.set("sortBy", params.sortBy);

  const queryString = qs.toString();
  const url = queryString
    ? `${apiUrl}/api/food/list?${queryString}`
    : `${apiUrl}/api/food/list`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch food list");
  const json: FoodListResponse = await res.json();
  return json.data;
}

export function FoodSection({ initialFoods }: FoodSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    FoodCategory | "All"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce search query (300ms)
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const category =
    selectedCategory === "All" ? undefined : selectedCategory;

  const {
    data: foods = initialFoods,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["foods", debouncedQuery, category, sortBy],
    queryFn: () =>
      fetchFoods({ q: debouncedQuery || undefined, category, sortBy }),
    initialData: !debouncedQuery && !category && sortBy === "newest"
      ? initialFoods
      : undefined,
    placeholderData: (prev) => prev,
  });

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
  }, []);

  const heading = useMemo(() => {
    if (debouncedQuery) {
      return `Results for "${debouncedQuery}"`;
    }
    return selectedCategory === "All" ? "All dishes" : selectedCategory;
  }, [debouncedQuery, selectedCategory]);

  return (
    <section className="mt-8 flex flex-col gap-8">
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <Separator />

      <div className="flex flex-col gap-6">
        {/* Search bar + Sort */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-foreground">{heading}</h2>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                aria-label="Search dishes"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort dishes"
                className="h-8 appearance-none rounded-lg border border-input bg-transparent py-1 pl-8 pr-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading indicator for server-side search */}
        {isFetching && debouncedQuery && (
          <p className="text-sm text-muted-foreground">Searching…</p>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load dishes. Please try refreshing the page.
          </p>
        )}

        <FoodGrid
          foods={foods}
          renderAction={(foodId) => <AddToCartButton foodId={foodId} />}
        />

        {/* Result count */}
        {(debouncedQuery || category) && foods.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {foods.length} {foods.length === 1 ? "dish" : "dishes"} found
            {debouncedQuery && (
              <Button
                variant="link"
                size="sm"
                onClick={clearSearch}
                className="ml-1"
              >
                Clear search
              </Button>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
