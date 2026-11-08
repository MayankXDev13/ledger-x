"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  HandCoins,
  Loader2,
  Phone,
  QrCode,
  Check,
  Settings,
  UserPlus,
} from "lucide-react";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { useCollection } from "@/hooks/useCollection";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { buildUpiQrPayload } from "@/lib/upi";
import type { CollectionRow } from "@/lib/api";
import { toast } from "sonner";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

function ageLabel(ageDays: number | null) {
  if (ageDays === null) return "—";
  if (ageDays === 0) return "Today";
  if (ageDays === 1) return "1 day";
  return `${ageDays} days`;
}

function ageTone(ageDays: number | null) {
  if (ageDays === null) return "text-muted-foreground";
  if (ageDays > 60) return "text-red-400";
  if (ageDays > 30) return "text-amber-400";
  return "text-emerald-400";
}

export default function CollectionPage() {
  const [sort, setSort] = useState<"amount" | "age">("amount");
  const { data, isLoading } = useCollection(sort);
  const { data: settings } = useSettings();
  const { user } = useAuth();

  const [qrRow, setQrRow] = useState<CollectionRow | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const payeeName =
    settings?.payeeName?.trim() ||
    user?.name?.trim() ||
    user?.email.split("@")[0] ||
    "Ledger-X";
  const upiId = settings?.upiId?.trim() ?? "";

  const upiUriFor = (row: CollectionRow) =>
    buildUpiQrPayload({
      upiId,
      payeeName,
      amount: row.outstanding,
      note: `Khata balance for ${row.name}`,
    });

  const copyLink = async (row: CollectionRow) => {
    if (!upiId) return;
    try {
      await navigator.clipboard.writeText(upiUriFor(row));
      setCopiedId(row.customerId);
      toast.success("UPI link copied");
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const rows = data?.data ?? [];
  const total = data?.totalReceivables ?? 0;

  const totalCount = useMemo(() => rows.length, [rows]);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full pb-24 lg:pb-8 fade-up">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Dashboard
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-xs text-foreground font-medium">Collection</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-sm shadow-primary/20">
            <HandCoins className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Collection
            </h1>
            <p className="text-xs text-muted-foreground">
              {totalCount} customer{totalCount === 1 ? "" : "s"} with an
              outstanding balance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1">
          <button
            type="button"
            onClick={() => setSort("amount")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
              sort === "amount"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            By amount
          </button>
          <button
            type="button"
            onClick={() => setSort("age")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
              sort === "age"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            By age
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-card">
          <CardContent className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total receivables
            </p>
            <p className="text-2xl font-bold text-foreground tabular mt-1">
              {isLoading ? "—" : formatCurrency(total)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding across active customers
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Collect via UPI
            </p>
            {upiId ? (
              <div className="mt-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {upiId}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Payee: {payeeName}
                </p>
              </div>
            ) : (
              <div className="mt-1 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Add your UPI ID to generate links and QR codes.
                </p>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                    <Settings className="w-3.5 h-3.5" />
                    Configure UPI
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card className="border-border/60 bg-card overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-foreground">
            Outstanding balances
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="divide-y divide-border/40">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <HandCoins className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Nothing to collect
              </h3>
              <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed mb-5">
                Every customer is settled. Add a customer and record a credit to
                see outstanding balances here.
              </p>
              <Link href="/customers">
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-brand text-primary-foreground font-semibold text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add a customer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {rows.map((row) => (
                <div
                  key={row.customerId}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/customers/detail?id=${row.customerId}`}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block"
                      >
                        {row.name}
                      </Link>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {row.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 sm:shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground tabular">
                        {formatCurrency(row.outstanding)}
                      </p>
                      <p
                        className={cn(
                          "text-[11px] font-medium",
                          ageTone(row.ageDays),
                        )}
                      >
                        Oldest unpaid: {ageLabel(row.ageDays)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs border-border/60"
                        disabled={!upiId}
                        onClick={() => copyLink(row)}
                        title={
                          upiId
                            ? "Copy a UPI intent link for this balance"
                            : "Configure your UPI ID first"
                        }
                      >
                        {copiedId === row.customerId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Copy link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs border-border/60"
                        disabled={!upiId}
                        onClick={() => setQrRow(row)}
                        title={
                          upiId
                            ? "Show a QR code for this balance"
                            : "Configure your UPI ID first"
                        }
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        QR
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!upiId && !isLoading && rows.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-amber-400">
          <Loader2 className="w-3.5 h-3.5" />
          UPI actions are disabled until you add a UPI ID in{" "}
          <Link href="/settings" className="underline underline-offset-2">
            settings
          </Link>
          .
        </p>
      )}

      <Dialog open={!!qrRow} onOpenChange={(open) => !open && setQrRow(null)}>
        <DialogContent className="sm:max-w-sm border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Collect from {qrRow?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Scan with any UPI app to pay {formatCurrency(qrRow?.outstanding ?? 0)} to{" "}
              {payeeName}.
            </DialogDescription>
          </DialogHeader>

          {qrRow && upiId && (
            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl">
                <QRCode
                  value={upiUriFor(qrRow)}
                  size={200}
                  aria-label={`UPI QR code for ${qrRow.name}`}
                />
              </div>
              <div className="w-full space-y-2 text-center">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(qrRow.outstanding)}
                </p>
                <p className="text-[11px] text-muted-foreground break-all">
                  {upiId}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Payment completion is recorded manually in the customer ledger.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2 h-9 text-xs"
                onClick={() => copyLink(qrRow)}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy UPI intent link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
