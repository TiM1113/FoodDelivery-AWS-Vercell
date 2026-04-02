"use client";

import { cn } from "@/lib/utils";
import type { FoodCategory } from "@/types/food";

const CATEGORIES: { name: FoodCategory; emoji: string }[] = [
  { name: "Salad", emoji: "🥗" },
  { name: "Rolls", emoji: "🌯" },
  { name: "Deserts", emoji: "🍰" },
  { name: "Sandwich", emoji: "🥪" },
  { name: "Cake", emoji: "🎂" },
  { name: "Pure Veg", emoji: "🥬" },
  { name: "Pasta", emoji: "🍝" },
  { name: "Noodles", emoji: "🍜" },
];

interface CategoryFilterProps {
  selected: FoodCategory | "All";
  onSelect: (category: FoodCategory | "All") => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div id="menu">
      <h2 className="text-2xl font-semibold text-foreground">Explore our menu</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Choose from a diverse menu featuring a delectable array of dishes. Our mission is to satisfy
        your cravings and elevate your dining experience, one delicious meal at a time.
      </p>

      <div className="-mx-2 mt-6 flex items-center gap-6 overflow-x-auto px-2 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => onSelect("All")}
          className={cn(
            "flex shrink-0 flex-col items-center gap-2 transition-transform hover:scale-105",
            selected === "All" && "scale-105",
          )}
        >
          <div
            className={cn(
              "flex h-[7.5vw] min-h-[80px] w-[7.5vw] min-w-[80px] items-center justify-center rounded-full bg-muted transition-all",
              selected === "All"
                ? "ring-4 ring-orange-500 ring-offset-0"
                : "hover:ring-2 hover:ring-muted-foreground/30",
            )}
          >
            <span aria-hidden="true" className="text-5xl">🍽️</span>
          </div>
          <span
            className={cn(
              "text-sm",
              selected === "All" ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            All
          </span>
        </button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onSelect(cat.name === selected ? "All" : cat.name)}
            className={cn(
              "flex shrink-0 flex-col items-center gap-2 transition-transform hover:scale-105",
              selected === cat.name && "scale-105",
            )}
          >
            <div
              className={cn(
                "flex h-[7.5vw] min-h-[80px] w-[7.5vw] min-w-[80px] items-center justify-center rounded-full bg-muted transition-all",
                selected === cat.name
                  ? "ring-4 ring-orange-500 ring-offset-0"
                  : "hover:ring-2 hover:ring-muted-foreground/30",
              )}
            >
              <span aria-hidden="true" className="text-5xl">{cat.emoji}</span>
            </div>
            <span
              className={cn(
                "text-sm",
                selected === cat.name ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
