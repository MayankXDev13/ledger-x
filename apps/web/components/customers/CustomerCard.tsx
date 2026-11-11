"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Pencil, Trash2, ChevronRight } from "lucide-react";
import type { Customer } from "@/lib/api";
import { cn } from "@/lib/utils";
import { avatarGradient } from "@/lib/avatar";

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export default function CustomerCard({
  customer,
  onEdit,
  onDelete,
}: CustomerCardProps) {
  const gradient = avatarGradient(customer.name);

  return (
    <div className="relative flex items-center gap-3.5 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-colors duration-200 card-hover group">
      {/* Avatar + identity are the link target; the actions sit outside it. */}
      <Link
        href={`/customers/detail?id=${customer.id}`}
        className="flex items-center gap-3.5 flex-1 min-w-0 group/link"
      >
        <div
          className={cn(
            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 text-white font-bold text-base shadow-sm",
            gradient
          )}
          aria-hidden="true"
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {customer.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Phone className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{customer.phone}</span>
          </div>
        </div>
      </Link>

      {/* Actions — always visible so touch and keyboard can reach them. */}
      <div className="shrink-0 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 sm:size-9 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => onEdit(customer)}
          aria-label={`Edit ${customer.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 sm:size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(customer.id)}
          aria-label={`Delete ${customer.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <ChevronRight
          className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
