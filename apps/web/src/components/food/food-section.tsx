"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CategoryFilter } from "./category-filter";
import { FoodGrid } from "./food-grid";
import type { Food, FoodCategory, FoodListResponse } from "@/types/food";

interface FoodSectionProps {
  initialFoods: Food[];
}

async function fetchFoodsClient(): Promise<Food[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}/api/food/list`);
  if (!res.ok) throw new Error("Failed to fetch food list");
  const json: FoodListResponse = await res.json();
  return json.data;
}

export function FoodSection({ initialFoods }: FoodSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: foods, isError } = useQuery({
    queryKey: ["foods"],
    queryFn: fetchFoodsClient,
    initialData: initialFoods,
  });

  const filteredFoods = useMemo(() => {
    let result = foods;

    if (selectedCategory !== "All") {
      result = result.filter((f) => f.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q),
      );
    }

    return result;
  }, [foods, selectedCategory, searchQuery]);

  return (
    <section className="mt-8 flex flex-col gap-8">
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

      <Separator />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-foreground">
            {selectedCategory === "All" ? "All dishes" : selectedCategory}
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              aria-label="Search dishes"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load dishes. Please try refreshing the page.
          </p>
        )}
        <FoodGrid foods={filteredFoods} />
      </div>
    </section>
  );
}
