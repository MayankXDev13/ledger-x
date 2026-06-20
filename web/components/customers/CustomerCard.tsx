"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Pencil, Trash2, ChevronRight } from "lucide-react";
import type { Customer } from "@/lib/api";
import { cn } from "@/lib/utils";

/* Deterministic avatar gradient */
function getAvatarGradient(name: string) {
  const gradients = [
    "from-brand to-brand-light",
    "from-emerald-400 to-teal-500",
    "from-violet-400 to-purple-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-500",
    "from-sky-400 to-blue-500",
  ];
  const index =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    gradients.length;
  return gradients[index];
}

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
  const gradient = getAvatarGradient(customer.name);

  return (
    <Link href={`/customers/${customer.id}`} className="block group">
      <div className="relative flex items-center gap-3.5 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 card-hover">
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/3 group-hover:to-primary/2 transition-all duration-300 pointer-events-none" />

        {/* Avatar */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 text-white font-bold text-base shadow-sm",
            gradient
          )}
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="relative flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {customer.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">{customer.phone}</span>
          </div>
        </div>

        {/* Actions — revealed on hover, chevron shown normally */}
        <div className="relative shrink-0 flex items-center gap-1">
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-2 group-hover:translate-x-0">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(customer);
              }}
              aria-label={`Edit ${customer.name}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(customer.id);
              }}
              aria-label={`Delete ${customer.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
        </div>
      </div>
    </Link>
  );
}