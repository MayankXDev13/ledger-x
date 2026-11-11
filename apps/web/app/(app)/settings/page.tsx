"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  Save,
  Trash2,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/hooks/useAuth";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  useDeleteAccount,
  useDownloadArchive,
  useExportCustomers,
  useExportTransactions,
} from "@/hooks/useDataPortability";
import { isValidUpiId } from "@/lib/upi";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              {title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { flags } = useFeatureFlags();
  // The UPI configuration is behind its own administrator flag.
  const upiEnabled = isFeatureEnabled(flags, "upi_collection");
  const collectionEnabled = isFeatureEnabled(flags, "collection");

  const exportCustomers = useExportCustomers();
  const exportTransactions = useExportTransactions();
  const downloadArchive = useDownloadArchive();
  // const deleteAccount = useDeleteAccount();

  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!settings) return;
    setUpiId(settings.upiId ?? "");
    setPayeeName(settings.payeeName ?? "");
  }, [settings]);

  const upiError =
    upiId.trim() && !isValidUpiId(upiId.trim())
      ? "Use a UPI ID like name@bank"
      : null;

  const saveUpi = () => {
    if (upiError) return;
    updateSettings.mutate(
      {
        upiId: upiId.trim() || null,
        payeeName: payeeName.trim() || null,
      },
      {
        onSuccess: () => toast.success("UPI settings saved"),
      },
    );
  };

  // const handleDelete = async () => {
  //   if (confirmText !== "DELETE") return;
  //   try {
  //     await deleteAccount.mutateAsync();
  //     setConfirmText("");
  //     await signOut();
  //     router.push("/login");
  //   } catch {
  //     // The mutation surfaces the error through a toast.
  //   }
  // };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full pb-24 lg:pb-8 fade-up">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" className="text-xs">
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs font-medium">
              Settings
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Account &amp; data
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure collections, download your data, or close your account.
        </p>
      </div>

      {/* UPI */}
      {upiEnabled && (
      <Section
        icon={Wallet}
        title="UPI collections"
        description="Customers scan your QR or open a UPI intent pre-filled with this ID. Payments are still recorded manually."
      >
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveUpi();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="upi-id" className="text-xs font-semibold">
                  UPI ID (VPA)
                </Label>
                <Input
                  id="upi-id"
                  name="upiId"
                  autoComplete="off"
                  placeholder="yourname@okhdfcbank"
                  value={upiId}
                  onChange={(event) => setUpiId(event.target.value)}
                  aria-invalid={upiError ? true : undefined}
                  aria-describedby={upiError ? "upi-error" : undefined}
                  className="h-10 bg-muted/20 border-border/50"
                />
                {upiError && (
                  <p
                    id="upi-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {upiError}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payee-name" className="text-xs font-semibold">
                  Payee name
                </Label>
                <Input
                  id="payee-name"
                  name="payeeName"
                  autoComplete="organization"
                  placeholder="Ramesh Kirana"
                  value={payeeName}
                  onChange={(event) => setPayeeName(event.target.value)}
                  className="h-10 bg-muted/20 border-border/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={updateSettings.isPending || !!upiError}
                className="gap-2 bg-gradient-brand text-primary-foreground font-semibold h-9"
              >
                {updateSettings.isPending ? (
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Save className="w-4 h-4" aria-hidden="true" />
                )}
                Save UPI settings
              </Button>
              <Link href="/collection" className={collectionEnabled ? "" : "hidden"}>
                <Button variant="outline" size="sm" className="h-9 text-xs">
                  Open collection view
                </Button>
              </Link>
            </div>
          </form>
        )}
      </Section>
      )}

      {/* Exports */}
      <Section
        icon={Download}
        title="Export &amp; archive"
        description="Downloads include every active record and exclude sample data. Amounts are in rupees with two decimals."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            className="justify-start gap-2 h-11 border-border/60"
            onClick={() => exportCustomers.mutate()}
            disabled={exportCustomers.isPending}
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-text" />
            Customers CSV
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 h-11 border-border/60"
            onClick={() => exportTransactions.mutate()}
            disabled={exportTransactions.isPending}
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-text" />
            Transactions CSV
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 h-11 border-border/60 sm:col-span-2"
            onClick={() => downloadArchive.mutate()}
            disabled={downloadArchive.isPending}
          >
            <FileJson className="w-4 h-4 text-primary" />
            Full account archive (JSON, includes soft-deleted rows)
          </Button>
        </div>
      </Section>

      {/* Danger zone */}
      {/* <Section
        icon={AlertTriangle}
        title="Delete account"
        description="This permanently removes your identity, customers, transactions, and settings. Audit markers are retained pseudonymously."
      >
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Type{" "}
            <span className="font-mono font-bold text-destructive">DELETE</span>{" "}
            to confirm. This cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm account deletion"
              className="h-9 bg-background border-destructive/30 font-mono"
            />
            <Button
              variant="destructive"
              className="gap-2 h-9"
              disabled={confirmText !== "DELETE" || deleteAccount.isPending}
              onClick={handleDelete}
            >
              {deleteAccount.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete my account
            </Button>
          </div>
        </div>
      </Section> */}
    </div>
  );
}
