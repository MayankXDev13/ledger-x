"use client";

import { useEffect, useState } from "react";
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
import { Loader2, User, Phone } from "lucide-react";
import type { Customer } from "@/lib/api";

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export function CustomerDialog({ open, onClose, customer }: CustomerDialogProps) {
  const create = useCreateCustomer();
  const update = useUpdateCustomer();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const isEditing = !!customer;

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
    } else {
      setName("");
      setPhone("");
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await update.mutateAsync({ id: customer!.id, data: { name, phone } });
    } else {
      await create.mutateAsync({ name, phone });
    }
    onClose();
  };

  const loading = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm border-border/60 bg-card">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-lg bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

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

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="cust-name"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="cust-name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-9 h-10 bg-muted/20 border-border/50 focus:border-cyan-500/50 focus:bg-background transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="cust-phone"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="cust-phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="pl-9 h-10 bg-muted/20 border-border/50 focus:border-cyan-500/50 focus:bg-background transition-all"
                type="tel"
              />
            </div>
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
              disabled={loading || !name || !phone}
              className="flex-1 h-10 bg-gradient-brand text-slate-900 font-bold shadow-sm shadow-cyan-500/20 hover:opacity-90"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
