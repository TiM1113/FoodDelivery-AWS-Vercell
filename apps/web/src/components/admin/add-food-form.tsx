"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AddFoodInputSchema,
  FoodCategorySchema,
  type AddFoodInput,
} from "@food-delivery/shared";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";

const CATEGORIES = FoodCategorySchema.options;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function AddFoodForm() {
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddFoodInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 type mismatch with @hookform/resolvers
    resolver: zodResolver(AddFoodInputSchema as any),
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
      category: "Salad",
    },
  });

  const previewUrl = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image],
  );
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const validateImage = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, WebP, and GIF images are accepted";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Image must be smaller than 5MB";
    }
    return null;
  };

  const handleImageChange = (file: File | undefined) => {
    if (!file) return;
    const error = validateImage(file);
    if (error) {
      setImageError(error);
      return;
    }
    setImageError(null);
    setImage(file);
  };

  const onSubmit = async (data: AddFoodInput) => {
    if (!image) {
      setImageError("Please select an image");
      return;
    }

    setUploading(true);

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch("/api/admin/food/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: image.name,
          contentType: image.type,
        }),
      });
      const presignData = await presignRes.json();

      if (!presignData.success) {
        toast.error(presignData.message || "Failed to get upload URL");
        return;
      }

      // Step 2: Upload to S3
      const s3Res = await fetch(presignData.uploadUrl, {
        method: "PUT",
        body: image,
        headers: { "Content-Type": image.type },
      });

      if (!s3Res.ok) {
        toast.error("Failed to upload image");
        return;
      }

      // Step 3: Save food item
      const res = await fetch("/api/admin/food/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          imageKey: presignData.key,
        }),
      });
      const result = await res.json();

      if (result.success) {
        toast.success(result.message || "Food item added");
        reset();
        setImage(null);
        setImageError(null);
      } else {
        toast.error(result.message || "Error adding food item");
      }
    } catch {
      toast.error("Error adding food item");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Add Food Item</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
        {/* Image upload */}
        <div className="space-y-2">
          <Label>Upload Image</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                width={200}
                height={200}
                className="rounded-md object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-10 w-10" />
                <span className="text-sm">Click to upload image</span>
                <span className="text-xs">JPEG, PNG, WebP, GIF (max 5MB)</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleImageChange(e.target.files?.[0]);
                if (e.target) e.target.value = "";
              }}
            />
          </label>
          {imageError && (
            <p className="text-sm text-destructive">{imageError}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter product name"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Product Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Write product description"
            rows={4}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        {/* Category + Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => { if (val) field.onChange(val); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              placeholder="25"
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={uploading} className="w-full">
          {uploading ? "Uploading..." : "Add Food Item"}
        </Button>
      </form>
    </div>
  );
}
