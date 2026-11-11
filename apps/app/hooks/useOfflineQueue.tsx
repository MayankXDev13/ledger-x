// Offline write queue controller: enqueue customer/transaction writes with
// device UUIDs, replay on connectivity change + app foreground, expose counts
// for the pending indicator and the failed-item review UI.
//
// The queue is owned by one provider for the whole app. Before this, every
// screen that used the queue ran its own `initQueue()` and its own
// `processQueue()` on reconnect, so the same FIFO rows could be replayed
// more than once.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
import { useConnectivity } from "@/hooks/useConnectivity";
import {
  createReplayGuard,
  pendingCustomersFrom,
  queuedEntriesFrom,
  submissionRejection,
  type PendingCustomer,
  type QueuedEntry,
  type QueueItem,
} from "@/lib/queue-core";

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

export type { PendingCustomer, QueuedEntry };

export interface OfflineQueueValue {
  items: QueueItem[];
  /**
   * Every transaction the queue knows about. An entry the server has not
   * accepted yet is marked `pending`; one the server just accepted stays in
   * the list until the server list holds it under the same id.
   */
  queuedEntries: QueuedEntry[];
  /** Customers created offline that the server has not accepted yet. */
  pendingCustomers: PendingCustomer[];
  outstanding: number;
  syncing: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  queueCustomer: (data: { name: string; phone: string }) => Promise<string>;
  queueTransaction: (data: OfflineWriteInput) => Promise<string>;
  retry: (id: string) => Promise<void>;
  discard: (id: string) => Promise<void>;
  sync: () => Promise<number>;
  reload: () => Promise<void>;
}

const OfflineQueueContext = createContext<OfflineQueueValue | null>(null);

/**
 * Raises the rejection of a queued write the server permanently refused.
 *
 * The queue keeps the write as a failed item so the user can review, retry or
 * discard it later, but the screen that submitted it has to hear about the
 * rejection as well — otherwise the user is told the entry was recorded when
 * the server never accepted it.
 */
async function assertAccepted(itemId: string): Promise<void> {
  const rejection = submissionRejection(await listAll(), itemId);
  if (rejection) throw new Error(rejection);
}

export function OfflineQueueProvider({ children }: { children: ReactNode }) {
  const { isOnline, appState } = useConnectivity();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [outstanding, setOutstanding] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const replayGuard = useRef(createReplayGuard()).current;

  const reload = useCallback(async () => {
    const [all, count] = await Promise.all([listAll(), outstandingCount()]);
    setItems(all);
    setOutstanding(count);
  }, []);

  const sync = useCallback(async () => {
    // One in-flight replay for the whole app: a second call is ignored
    // rather than racing the first one over the same FIFO rows.
    const accepted = await replayGuard.run(async () => {
      setSyncing(true);
      try {
        const count = await processQueue(execute);
        await reload();
        if (count > 0) setLastSyncedAt(new Date().toISOString());
        return count;
      } finally {
        setSyncing(false);
      }
    });
    return accepted ?? 0;
  }, [reload]);

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
  /**
   * Queue a customer creation; returns the device UUID used as the id.
   *
   * When the device is online the queue is replayed straight away, so the
   * server has the record before the caller refetches. Without this a write
   * sat in the local queue until the app was backgrounded and refocused, and
   * every screen that reads from the server showed stale data for tens of
   * seconds.
   *
   * When that immediate replay is permanently rejected, the rejection is
   * raised to the caller: the screen that submitted the write must not tell
   * the user it was recorded when the server refused it.
   */
  const queueCustomer = useCallback(
    async (data: { name: string; phone: string }): Promise<string> => {
      const item = await enqueue("customer.create", data);
      await reload();
      if (isOnline) {
        await sync();
        await assertAccepted(item.id);
      }
      return item.id;
    },
    [reload, sync, isOnline],
  );

  /**
   * Queue a ledger entry against a (possibly device-created) customer id.
   *
   * Replays immediately when online, for the same reason as `queueCustomer`,
   * and reports a permanent rejection to the caller the same way.
   */
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
      if (isOnline) {
        await sync();
        await assertAccepted(item.id);
      }
      return item.id;
    },
    [reload, sync, isOnline],
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

  /** Queued writes the server has not accepted yet. */
  const queuedEntries = useMemo(() => queuedEntriesFrom(items), [items]);
  const pendingCustomers = useMemo(() => pendingCustomersFrom(items), [items]);

  const value = useMemo<OfflineQueueValue>(
    () => ({
      items,
      queuedEntries,
      pendingCustomers,
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
    }),
    [
      items,
      queuedEntries,
      pendingCustomers,
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
    ],
  );

  return (
    <OfflineQueueContext.Provider value={value}>
      {children}
    </OfflineQueueContext.Provider>
  );
}

/** The shared offline queue. Throws if used outside the provider. */
export function useOfflineQueue(): OfflineQueueValue {
  const value = useContext(OfflineQueueContext);
  if (!value) {
    throw new Error("useOfflineQueue must be used inside an OfflineQueueProvider");
  }
  return value;
}

export type QueuedCustomer = Customer;
export type QueuedTransaction = Transaction;
