"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const S3_URL =
  process.env.NEXT_PUBLIC_S3_URL ||
  "https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com";

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

interface FoodItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

interface EditingData {
  name: string;
  category: string;
  price: string;
}

function getImageUrl(image: string): string {
  if (image.startsWith("http")) return image;
  return `${S3_URL}/${image}`;
}

export function FoodList() {
  const [list, setList] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingData>({
    name: "",
    category: "",
    price: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const editPreviewUrl = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : null),
    [selectedImage],
  );
  useEffect(() => {
    return () => { if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl); };
  }, [editPreviewUrl]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/food/list");
      const data = await res.json();
      if (data.success) {
        setList(data.data);
      } else {
        toast.error(data.message || "Error loading food items");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const removeFood = async (foodId: string) => {
    try {
      const res = await fetch("/api/admin/food/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: foodId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Food item removed");
        await fetchList();
      } else {
        toast.error(data.message || "Error deleting item");
      }
    } catch {
      toast.error("Error connecting to server");
    }
  };

  const startEditing = (item: FoodItem) => {
    setEditingId(item._id);
    setEditingData({
      name: item.name,
      category: item.category,
      price: String(item.price),
    });
    setSelectedImage(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingData({ name: "", category: "", price: "" });
    setSelectedImage(null);
  };

  const saveEdit = async (itemId: string) => {
    try {
      let imageKey: string | undefined;

      if (selectedImage) {
        const presignRes = await fetch("/api/admin/food/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: selectedImage.name,
            contentType: selectedImage.type,
          }),
        });
        const presignData = await presignRes.json();
        if (!presignData.success) {
          toast.error(presignData.message || "Failed to get upload URL");
          return;
        }

        const s3Res = await fetch(presignData.uploadUrl, {
          method: "PUT",
          body: selectedImage,
          headers: { "Content-Type": selectedImage.type },
        });
        if (!s3Res.ok) {
          toast.error("Failed to upload image");
          return;
        }
        imageKey = presignData.key;
      }

      const res = await fetch("/api/admin/food/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          name: editingData.name,
          category: editingData.category,
          price: Number(editingData.price),
          ...(imageKey && { imageKey }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Food item updated");
        cancelEditing();
        await fetchList();
      } else {
        toast.error(data.message || "Error updating item");
      }
    } catch {
      toast.error("Error connecting to server");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">All Food Items</h2>

      {list.length === 0 ? (
        <p className="text-muted-foreground">No food items found.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-24">Price</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item._id}>
                  {editingId === item._id ? (
                    <>
                      <TableCell>
                        <label className="cursor-pointer">
                          <Image
                            src={
                              editPreviewUrl ?? getImageUrl(item.image)
                            }
                            alt={item.name}
                            width={56}
                            height={56}
                            className="rounded-md object-cover"
                            unoptimized={!!editPreviewUrl}
                          />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedImage(file);
                            }}
                          />
                        </label>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editingData.name}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              name: e.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editingData.category}
                          onValueChange={(val) => {
                            if (val) setEditingData({
                              ...editingData,
                              category: val,
                            });
                          }}
                        >
                          <SelectTrigger className="w-32">
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
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingData.price}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              price: e.target.value,
                            })
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => saveEdit(item._id)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>${item.price}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditing(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={<Button size="icon" variant="ghost" />}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete &ldquo;{item.name}&rdquo;?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The food item
                                  will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeFood(item._id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
