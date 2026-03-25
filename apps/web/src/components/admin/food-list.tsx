"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  FoodCategorySchema,
  AddFoodInputSchema,
  type AddFoodInput,
} from "@food-delivery/shared";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const S3_URL =
  process.env.NEXT_PUBLIC_S3_URL ||
  "https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com";

const CATEGORIES = FoodCategorySchema.options;

interface FoodItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

function getImageUrl(image: string): string {
  if (image.startsWith("http")) return image;
  return `${S3_URL}/${image}`;
}

export function FoodList() {
  const [list, setList] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Edit dialog state
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const editPreviewUrl = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : null),
    [selectedImage],
  );
  useEffect(() => {
    return () => { if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl); };
  }, [editPreviewUrl]);

  // Reuse AddFoodInputSchema (not UpdateFoodInputSchema) because the edit form
  // fields are identical; the id comes from editItem._id at submit time.
  const editForm = useForm<AddFoodInput>({
    resolver: zodResolver(AddFoodInputSchema),
  });

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

  const openEditDialog = (item: FoodItem) => {
    setEditItem(item);
    setSelectedImage(null);
    editForm.reset({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category as AddFoodInput["category"],
    });
  };

  const closeEditDialog = () => {
    setEditItem(null);
    setSelectedImage(null);
    editForm.reset();
  };

  const onEditSubmit = async (data: AddFoodInput) => {
    if (!editItem) return;
    setSaving(true);

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
          id: editItem._id,
          ...data,
          ...(imageKey && { imageKey }),
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Food item updated");
        closeEditDialog();
        await fetchList();
      } else {
        toast.error(result.message || "Error updating item");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setSaving(false);
    }
  };

  // Column definitions
  const columns = useMemo<ColumnDef<FoodItem>[]>(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <Image
            src={getImageUrl(row.original.image)}
            alt={row.original.name}
            width={48}
            height={48}
            className="rounded-md object-cover"
          />
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Category
            <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        ),
        filterFn: "equals",
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ getValue }) => `$${getValue<number>()}`,
        size: 100,
      },
      {
        id: "actions",
        header: "Actions",
        size: 120,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openEditDialog(item)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button size="icon" variant="ghost">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  }
                />

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete &ldquo;{item.name}&rdquo;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The food item will be
                      permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeFood(item._id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable column defs
    [],
  );

  const table = useReactTable({
    data: list,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

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

      {/* Toolbar: search + category filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={
            (table.getColumn("category")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(val) =>
            table
              .getColumn("category")
              ?.setFilterValue(val === "all" ? undefined : val)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground">No food items found.</p>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} item(s) total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount() || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Edit dialog */}
      <Dialog
        open={!!editItem}
        onOpenChange={(open) => { if (!open) closeEditDialog(); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Food Item</DialogTitle>
            <DialogDescription>
              Update the food item details below.
            </DialogDescription>
          </DialogHeader>

          {editItem && (
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="space-y-4"
          >
            {/* Image preview + change */}
            <div className="space-y-2">
              <Label>Image</Label>
              <label className="flex cursor-pointer items-center gap-4">
                <Image
                  src={editPreviewUrl ?? getImageUrl(editItem.image)}
                  alt={editItem.name}
                  width={64}
                  height={64}
                  className="rounded-md object-cover"
                  unoptimized={!!editPreviewUrl}
                />
                <span className="text-sm text-muted-foreground">
                  Click to change image
                </span>
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
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                {...editForm.register("name")}
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                {...editForm.register("description")}
              />
              {editForm.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                name="category"
                control={editForm.control}
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
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                {...editForm.register("price", { valueAsNumber: true })}
              />
              {editForm.formState.errors.price && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.price.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
