"use client";

import { MapPin, Pencil, Star, Trash2 } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SavedAddress } from "@/types/address";

interface AddressCardProps {
  address: SavedAddress;
  onEdit: () => void;
  onDelete: () => void;
}

export function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{address.label}</span>
          {address.isDefault && (
            <Badge variant="secondary" className="text-xs">
              <Star className="mr-1 h-3 w-3" />
              Default
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                />
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete address?</AlertDialogTitle>
                <AlertDialogDescription>
                  {address.isDefault
                    ? "This is your default address. Deleting it will automatically set another address as your default."
                    : "This address will be permanently removed. This action cannot be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        <p>
          {address.firstName} {address.lastName}
        </p>
        <p>{address.street}</p>
        <p>
          {address.city}, {address.state} {address.zipcode}
        </p>
        <p>{address.country}</p>
        <p>{address.phone}</p>
      </div>
    </div>
  );
}
