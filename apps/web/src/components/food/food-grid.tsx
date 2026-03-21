import type { Food } from "@/types/food";
import { FoodCard } from "./food-card";

interface FoodGridProps {
  foods: Food[];
}

export function FoodGrid({ foods }: FoodGridProps) {
  if (foods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">No dishes found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try selecting a different category or adjusting your search.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {foods.map((food) => (
        <FoodCard key={food._id} food={food} />
      ))}
    </div>
  );
}
