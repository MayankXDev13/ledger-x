// Offline write queue controller: enqueue customer/transaction writes with
// device UUIDs, replay on connectivity change + app foreground, expose counts
// for the pending indicator and the failed-item review UI.
import { useCallback, useEffect, useState } from "react";
import {
  discardItem,
  enqueue,
  initQueue,
  listAll,
  outstandingCount,
  processQueue,
  retryItem,
} from "@/lib/offline-queue";
import {
  customersApi,
  transactionsApi,
  type Customer,
  type PaymentMethod,
  type Transaction,
} from "@/lib/api";
import { useConnectivity } from "./useConnectivity";
import type { QueueItem } from "@/lib/queue-core";

async function execute(
  kind: QueueItem["kind"],
  payload: Record<string, unknown>,
): Promise<unknown> {
  if (kind === "customer.create") {
    return customersApi.create(payload as { id: string; name: string; phone: string });
  }
  return transactionsApi.create(
    payload as {
      id: string;
      customerId: string;
      amount: number;
      type: "credit" | "debit";
      paymentMethod?: PaymentMethod | null;
      note?: string;
    },
  );
}

export interface OfflineWriteInput {
  customerId: string;
  amount: number;
  type: "credit" | "debit";
  paymentMethod?: PaymentMethod | null;
  note?: string;
}

export function useOfflineQueue() {
  const { isOnline, appState } = useConnectivity();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [outstanding, setOutstanding] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [all, count] = await Promise.all([listAll(), outstandingCount()]);
    setItems(all);
    setOutstanding(count);
  }, []);

  const sync = useCallback(async () => {
    if (syncing) return 0;
    setSyncing(true);
    try {
      const accepted = await processQueue(execute);
      await reload();
      if (accepted > 0) setLastSyncedAt(new Date().toISOString());
      return accepted;
    } finally {
      setSyncing(false);
    }
  }, [reload, syncing]);

  // Replay on connectivity change and on app foreground.
  useEffect(() => {
    if (isOnline && appState === "active") {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, appState]);

  useEffect(() => {
    initQueue().then(reload);
  }, [reload]);

  /** Queue a customer creation; returns the device UUID used as the id. */
  const queueCustomer = useCallback(
    async (data: { name: string; phone: string }): Promise<string> => {
      const item = await enqueue("customer.create", data);
      await reload();
      return item.id;
    },
    [reload],
  );

  /** Queue a ledger entry against a (possibly device-created) customer id. */
  const queueTransaction = useCallback(
    async (data: OfflineWriteInput): Promise<string> => {
      const item = await enqueue("transaction.create", {
        amount: data.amount,
        customerId: data.customerId,
        type: data.type,
        paymentMethod: data.paymentMethod ?? null,
        note: data.note,
      });
      await reload();
      return item.id;
    },
    [reload],
  );

  const retry = useCallback(
    async (id: string) => {
      await retryItem(id);
      await reload();
      await sync();
    },
    [reload, sync],
  );

  const discard = useCallback(
    async (id: string) => {
      await discardItem(id);
      await reload();
    },
    [reload],
  );

  return {
    items,
    outstanding,
    syncing,
    isOnline,
    lastSyncedAt,
    queueCustomer,
    queueTransaction,
    retry,
    discard,
    sync,
    reload,
  };
}

export type QueuedCustomer = Customer;
export type QueuedTransaction = Transaction;
