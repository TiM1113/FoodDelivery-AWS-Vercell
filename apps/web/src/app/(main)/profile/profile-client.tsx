"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsProvider } from "@/components/google-maps-provider";
import type { SavedAddress } from "@/types/address";
import { AddressCard } from "./address-card";
import { AddressDialog } from "./address-dialog";

interface ProfileClientProps {
  initialName: string;
  email: string;
  initialAddresses: SavedAddress[];
}

export function ProfileClient({
  initialName,
  email,
  initialAddresses,
}: ProfileClientProps) {
  const [name, setName] = useState(initialName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null,
  );

  const handleSaveName = async () => {
    if (!name.trim() || name === initialName) return;
    setIsSavingName(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Name updated");
      } else {
        toast.error(data.message || "Failed to update name");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveAddress = async (
    address: Omit<SavedAddress, "id" | "userId" | "createdAt">,
    id?: string,
  ) => {
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...address, ...(id && { id }) }),
      });
      const data = await res.json();
      if (data.success) {
        if (id) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === id ? data.data : a)),
          );
        } else {
          setAddresses((prev) => [...prev, data.data]);
        }
        // If this was set as default, clear default on others
        if (address.isDefault) {
          setAddresses((prev) =>
            prev.map((a) =>
              a.id === data.data.id ? data.data : { ...a, isDefault: false },
            ),
          );
        }
        toast.success(id ? "Address updated" : "Address added");
        setDialogOpen(false);
        setEditingAddress(null);
      } else {
        toast.error(data.message || "Failed to save address");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const res = await fetch("/api/user/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId }),
      });
      const data = await res.json();
      if (data.success) {
        setAddresses((prev) => {
          const remaining = prev.filter((a) => a.id !== addressId);
          // If the backend promoted another address to default, update it locally
          if (data.promotedDefaultId) {
            return remaining.map((a) =>
              a.id === data.promotedDefaultId ? { ...a, isDefault: true } : a,
            );
          }
          return remaining;
        });
        toast.success("Address deleted");
      } else {
        toast.error(data.message || "Failed to delete address");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-sm"
              />
              <Button
                onClick={handleSaveName}
                disabled={isSavingName || !name.trim() || name === initialName}
                size="sm"
              >
                {isSavingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Saved Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Saved Addresses</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingAddress(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No saved addresses yet. Add one to speed up checkout.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onEdit={() => handleEditAddress(addr)}
                  onDelete={() => handleDeleteAddress(addr.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {dialogOpen && <GoogleMapsProvider />}
      <AddressDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAddress(null);
        }}
        address={editingAddress}
        onSave={handleSaveAddress}
      />
    </div>
  );
}
