"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { FaUser, FaPhone, FaSpinner } from "react-icons/fa";
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

  const isEditing = !!customer;

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || { name: "", phone: "" },
  });

  const handleSubmit = async (data: CustomerFormData) => {
    if (isEditing) {
      await update.mutateAsync({ id: customer!.id, data });
    } else {
      await create.mutateAsync(data);
    }
    onClose();
  };

  useEffect(() => {
    if (customer) {
      form.reset({ name: customer.name, phone: customer.phone });
    } else {
      form.reset({ name: "", phone: "" });
    }
  }, [customer, open, form]);

  const loading = create.isPending || update.isPending;

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
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? "Update customer information"
                : "Add a new customer to your ledger"}
            </p>
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
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="cust-name"
                placeholder="e.g. Rahul Sharma"
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
              <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="cust-phone"
                placeholder="+91 98765 43210"
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
              disabled={loading || !form.formState.isValid}
              className="flex-1 h-10 bg-gradient-brand text-primary-foreground font-bold shadow-sm shadow-primary/20 hover:opacity-90"
            >
              {loading && <FaSpinner className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </FormProvider>
  );
}
