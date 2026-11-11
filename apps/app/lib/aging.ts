import type { AgingBuckets } from "@/lib/api";

export type AgeBucket = keyof AgingBuckets;

export const AGE_BUCKETS: AgeBucket[] = ["0-30", "31-60", "60+"];

/** Maps an unpaid age in days to its aging bucket. Null means no balance. */
export function ageBucket(ageDays: number | null | undefined): AgeBucket | null {
  if (ageDays === null || ageDays === undefined) return null;
  if (ageDays <= 30) return "0-30";
  if (ageDays <= 60) return "31-60";
  return "60+";
}

export function agingTotal(buckets: AgingBuckets): number {
  return buckets["0-30"] + buckets["31-60"] + buckets["60+"];
}

export interface AgingSegment {
  bucket: AgeBucket;
  amount: number;
  /** Share of total rupees, 0 when there is no outstanding money. */
  fraction: number;
}

/** Turns aggregate aging rupees into proportional segments for Home. */
export function agingSegments(buckets: AgingBuckets): AgingSegment[] {
  const total = agingTotal(buckets);
  return AGE_BUCKETS.map((bucket) => ({
    bucket,
    amount: buckets[bucket],
    fraction: total > 0 ? buckets[bucket] / total : 0,
  }));
}
