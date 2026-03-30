"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AddressAutocomplete,
  type AddressComponents,
} from "@/components/address-autocomplete";
import type { SavedAddress } from "@/types/address";

const addressFormSchema = z.object({
  label: z.string().min(1, "Label is required").max(50),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Please enter a valid email"),
  street: z.string().min(1, "Street is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  zipcode: z.string().min(1, "Zip code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  phone: z.string().min(1, "Phone is required").max(30),
  isDefault: z.boolean(),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: SavedAddress | null;
  onSave: (
    data: Omit<SavedAddress, "id" | "userId" | "createdAt">,
    id?: string,
  ) => Promise<void>;
}

export function AddressDialog({
  open,
  onOpenChange,
  address,
  onSave,
}: AddressDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue: setFormValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4.3 internal version mismatch with @hookform/resolvers types; runtime works correctly
    resolver: zodResolver(addressFormSchema as any),
    defaultValues: {
      label: "Home",
      firstName: "",
      lastName: "",
      email: "",
      street: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
      phone: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (address) {
        reset({
          label: address.label,
          firstName: address.firstName,
          lastName: address.lastName,
          email: address.email,
          street: address.street,
          city: address.city,
          state: address.state,
          zipcode: address.zipcode,
          country: address.country,
          phone: address.phone,
          isDefault: address.isDefault,
        });
      } else {
        reset({
          label: "Home",
          firstName: "",
          lastName: "",
          email: "",
          street: "",
          city: "",
          state: "",
          zipcode: "",
          country: "",
          phone: "",
          isDefault: false,
        });
      }
    }
  }, [open, address, reset]);

  const streetValue = watch("street");

  const handleAddressSelect = (components: AddressComponents) => {
    setFormValue("street", components.street, { shouldValidate: true });
    setFormValue("city", components.city, { shouldValidate: true });
    setFormValue("state", components.state, { shouldValidate: true });
    setFormValue("zipcode", components.zipcode, { shouldValidate: true });
    setFormValue("country", components.country, { shouldValidate: true });
  };

  const onSubmit = async (data: AddressFormData) => {
    setIsSaving(true);
    try {
      await onSave(data, address?.id);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {address ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Label */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addr-label">Label</Label>
            <Input
              id="addr-label"
              placeholder="Home, Work, etc."
              {...register("label")}
            />
            {errors.label && (
              <p className="text-xs text-destructive">
                {errors.label.message}
              </p>
            )}
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-firstName">First Name</Label>
              <Input id="addr-firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-lastName">Last Name</Label>
              <Input id="addr-lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addr-email">Email</Label>
            <Input id="addr-email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Street — with Google Places autocomplete */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addr-street">Street Address</Label>
            <AddressAutocomplete
              value={streetValue}
              onChange={(val) =>
                setFormValue("street", val, { shouldValidate: true })
              }
              onSelect={handleAddressSelect}
              placeholder="Start typing an address…"
              disabled={isSaving}
            />
            {errors.street && (
              <p className="text-xs text-destructive">
                {errors.street.message}
              </p>
            )}
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-city">City</Label>
              <Input id="addr-city" {...register("city")} />
              {errors.city && (
                <p className="text-xs text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-state">State</Label>
              <Input id="addr-state" {...register("state")} />
              {errors.state && (
                <p className="text-xs text-destructive">
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>

          {/* Zip + Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-zipcode">Zip Code</Label>
              <Input id="addr-zipcode" {...register("zipcode")} />
              {errors.zipcode && (
                <p className="text-xs text-destructive">
                  {errors.zipcode.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="addr-country">Country</Label>
              <Input id="addr-country" {...register("country")} />
              {errors.country && (
                <p className="text-xs text-destructive">
                  {errors.country.message}
                </p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addr-phone">Phone</Label>
            <Input id="addr-phone" type="tel" {...register("phone")} />
            {errors.phone && (
              <p className="text-xs text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Default checkbox */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              {...register("isDefault")}
            />
            Set as default address
          </label>

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : address ? (
              "Update Address"
            ) : (
              "Add Address"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
