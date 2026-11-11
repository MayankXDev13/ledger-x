"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarRange,
  FileText,
  Printer,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import { useStatement } from "@/hooks/useStatement";
import { paymentMethodLabel } from "@/lib/payments";
import { formatCurrency } from "@/lib/format";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";


export function StatementView() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("id") ?? "";

  const [start, setStart] = useState(searchParams.get("start") ?? "");
  const [end, setEnd] = useState(searchParams.get("end") ?? "");
  const [applied, setApplied] = useState({
    start: searchParams.get("start") ?? "",
    end: searchParams.get("end") ?? "",
  });
  const [periodError, setPeriodError] = useState<string | null>(null);

  /** Applies the period, refusing a range whose start is after its end. */
  const applyPeriod = () => {
    if (start && end && start > end) {
      setPeriodError("The start date must be on or before the end date.");
      return;
    }
    setPeriodError(null);
    setApplied({ start, end });
  };

  const { data: statement, isLoading } = useStatement(customerId, {
    start: applied.start || undefined,
    end: applied.end || undefined,
  });

  const hasEntries = (statement?.entries.length ?? 0) > 0;

  const periodLabel = useMemo(() => {
    if (applied.start && applied.end) {
      return `${format(new Date(applied.start), "dd MMM yyyy")} – ${format(
        new Date(applied.end),
        "dd MMM yyyy",
      )}`;
    }
    if (applied.start) {
      return `From ${format(new Date(applied.start), "dd MMM yyyy")}`;
    }
    if (applied.end) {
      return `Until ${format(new Date(applied.end), "dd MMM yyyy")}`;
    }
    return "All transactions";
  }, [applied]);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full pb-24 lg:pb-8 fade-up">
      {/* Screen-only toolbar */}
      <div className="print:hidden flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/customers/detail?id=${customerId}`} className="text-xs">
                  Customer
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs font-medium">Statement</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Account statement
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Print or save this statement as a PDF from your browser.
            </p>
          </div>
          <Button
            onClick={() => window.print()}
            disabled={!statement}
            className="gap-2 bg-gradient-brand text-primary-foreground font-semibold h-9"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </Button>
        </div>

        {/* Period filter */}
        <form
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault();
            applyPeriod();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="statement-start" className="text-xs font-semibold">
              Start date
            </Label>
            <Input
              id="statement-start"
              name="start"
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              aria-invalid={periodError ? true : undefined}
              aria-describedby={periodError ? "statement-period-error" : undefined}
              className="h-9 w-40 bg-muted/20 border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="statement-end" className="text-xs font-semibold">
              End date
            </Label>
            <Input
              id="statement-end"
              name="end"
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              aria-invalid={periodError ? true : undefined}
              aria-describedby={periodError ? "statement-period-error" : undefined}
              className="h-9 w-40 bg-muted/20 border-border/50"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
          >
            <CalendarRange className="w-3.5 h-3.5" aria-hidden="true" />
            Apply
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => {
              setStart("");
              setEnd("");
              setPeriodError(null);
              setApplied({ start: "", end: "" });
            }}
          >
            Clear
          </Button>
          {periodError ? (
            <p
              id="statement-period-error"
              role="alert"
              className="w-full text-xs font-medium text-destructive"
            >
              {periodError}
            </p>
          ) : null}
        </form>
      </div>

      {/* Printable document */}
      <div className="statement-document rounded-xl border border-border bg-card p-6 sm:p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-6 pb-5 border-b border-border">
          <div>
            <p className="text-lg font-bold text-foreground tracking-tight">
              Ledger<span className="text-primary">-X</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customer account statement
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Statement period</p>
            <p className="text-sm font-semibold text-foreground">
              {periodLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Generated {format(new Date(), "dd MMM yyyy, h:mm a")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !statement ? (
          <div className="py-14 text-center">
            <p className="text-sm text-muted-foreground">
              No statement available for this customer.
            </p>
          </div>
        ) : (
          <>
            {/* Customer block */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Customer
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {statement.customer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {statement.customer.phone}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-right">
                <span className="text-xs text-muted-foreground">
                  Opening balance
                </span>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {formatCurrency(statement.openingBalance)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Total credit
                </span>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {formatCurrency(statement.totalCredit)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Total paid
                </span>
                <span className="text-xs font-semibold text-positive tabular-nums">
                  {formatCurrency(statement.totalDebit)}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Closing balance
                </span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {formatCurrency(statement.closingBalance)}
                </span>
              </div>
            </div>

            {/* Entries */}
            <div className="rounded-lg border border-border overflow-x-auto print:border-border print:overflow-visible">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-muted/40">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="px-3 py-2 font-semibold">Date</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Description</th>
                    <th scope="col" className="px-3 py-2 font-semibold text-right">
                      Credit
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold text-right">Paid</th>
                    <th scope="col" className="px-3 py-2 font-semibold text-right">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {hasEntries ? (
                    statement.entries.map((entry) => {
                      const method = paymentMethodLabel(entry.paymentMethod);
                      return (
                        <tr key={entry.id} className="align-top">
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                            {format(new Date(entry.date), "dd MMM yyyy")}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-foreground">
                              {entry.note ||
                                (entry.type === "credit"
                                  ? "Credit"
                                  : "Payment")}
                            </span>
                            {method && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs px-1.5 py-0 h-4 font-semibold bg-positive/10 text-positive border-positive/25"
                              >
                                {method}
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                            {entry.type === "credit"
                              ? formatCurrency(entry.amount)
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-positive">
                            {entry.type === "debit"
                              ? formatCurrency(entry.amount)
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-foreground">
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-10 text-center text-muted-foreground"
                      >
                        <CheckCircle2 className="w-5 h-5 mx-auto mb-2 opacity-40" />
                        No transactions in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Balances are computed over the customer&apos;s full history.
              Soft-deleted entries are excluded. This statement is generated by
              Ledger-X and is not a tax invoice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
