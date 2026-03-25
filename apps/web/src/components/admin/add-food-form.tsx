"use client";

import { useEffect, useMemo, useState } from "react";
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

const CATEGORIES = [
  "Salad",
  "Rolls",
  "Deserts",
  "Sandwich",
  "Cake",
  "Pure Veg",
  "Pasta",
  "Noodles",
] as const;

export function AddFoodForm() {
  const [image, setImage] = useState<File | null>(null);
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad",
  });
  const [uploading, setUploading] = useState(false);

  const previewUrl = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image],
  );
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast.error("Please select an image");
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
          name: data.name,
          description: data.description,
          price: Number(data.price),
          category: data.category,
          imageKey: presignData.key,
        }),
      });
      const result = await res.json();

      if (result.success) {
        toast.success(result.message || "Food item added");
        setData({ name: "", description: "", price: "", category: "Salad" });
        setImage(null);
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

      <form onSubmit={onSubmit} className="max-w-xl space-y-6">
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
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImage(file);
                if (e.target) e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Enter product name"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Product Description</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="Write product description"
            rows={4}
            required
          />
        </div>

        {/* Category + Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={data.category}
              onValueChange={(val) => { if (val) setData({ ...data, category: val }); }}
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={data.price}
              onChange={(e) => setData({ ...data, price: e.target.value })}
              placeholder="25"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={uploading} className="w-full">
          {uploading ? "Uploading..." : "Add Food Item"}
        </Button>
      </form>
    </div>
  );
}
