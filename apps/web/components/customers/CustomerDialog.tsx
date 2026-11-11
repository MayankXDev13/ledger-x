"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { Loader2, Phone, User } from "lucide-react";
import { customerSchema, type CustomerFormData } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import type { Customer } from "@/lib/api";

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export function CustomerDialog({ open, onClose, customer }: CustomerDialogProps) {
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!customer;

  const form = useForm({
    resolver: zodResolver(customerSchema),
    mode: "onBlur",
    defaultValues: customer || { name: "", phone: "" },
  });

  const handleSubmit = async (data: CustomerFormData) => {
    setSubmitError(null);
    try {
      if (isEditing) {
        await update.mutateAsync({ id: customer!.id, data });
      } else {
        await create.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not save the customer. Please try again.",
      );
    }
  };

  useEffect(() => {
    if (customer) {
      form.reset({ name: customer.name, phone: customer.phone });
    } else {
      form.reset({ name: "", phone: "" });
    }
  }, [customer, open, form]);

  const loading = create.isPending || update.isPending;
  const nameError = form.formState.errors.name?.message;
  const phoneError = form.formState.errors.phone?.message;

  return (
    <FormProvider {...form}>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="sm:max-w-sm border-border/60 bg-card">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-lg bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <DialogHeader className="pb-1">
            <DialogTitle className="text-base font-bold">
              {isEditing ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEditing
                ? "Update customer information"
                : "Add a new customer to your ledger"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="cust-name"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <Input
                id="cust-name"
                autoComplete="name"
                placeholder="e.g. Rahul Sharma"
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? "name-error" : undefined}
                {...form.register("name")}
                className={cn(
                  "pl-9 h-10 bg-muted/20 border-border/50 focus:border-primary/50 focus:bg-background transition-all",
                  form.formState.errors.name && "border-destructive"
                )}
              />
            </div>
            <FormError name="name" />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="cust-phone"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <Input
                id="cust-phone"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                aria-invalid={phoneError ? true : undefined}
                aria-describedby={phoneError ? "phone-error" : undefined}
                {...form.register("phone")}
                className={cn(
                  "pl-9 h-10 bg-muted/20 border-border/50 focus:border-primary/50 focus:bg-background transition-all",
                  form.formState.errors.phone && "border-destructive"
                )}
                type="tel"
              />
            </div>
            <FormError name="phone" />
          </div>

          {submitError ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {submitError}
            </p>
          ) : null}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border/60 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 bg-gradient-brand text-primary-foreground font-bold shadow-sm shadow-primary/20 hover:opacity-90"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
              {isEditing ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </FormProvider>
  );
}
