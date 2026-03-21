import Image from "next/image";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Food } from "@/types/food";

interface FoodCardProps {
  food: Food;
  action?: React.ReactNode;
}

export function FoodCard({ food, action }: FoodCardProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-[200px] w-full">
        <Image
          src={food.image}
          alt={food.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {action && <div className="absolute bottom-3 right-3">{action}</div>}
      </div>

      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="truncate text-base font-semibold text-foreground">{food.name}</h3>
          <div className="flex shrink-0 items-center gap-0.5 text-orange-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current opacity-40" />
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{food.description}</p>

        <p className="text-lg font-bold text-orange-600">${food.price.toFixed(2)}</p>
      </CardContent>
    </Card>
  );
}
