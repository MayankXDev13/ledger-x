import { View, Text } from "react-native";
import type { AgingBuckets } from "@/lib/api";
import { AGE_BUCKETS, ageBucket, agingSegments } from "@/lib/aging";
import { cn } from "@/lib/cn";

type AgingStripProps =
  | {
      mode: "proportional";
      buckets: AgingBuckets;
      className?: string;
    }
  | {
      mode: "bucket";
      ageDays: number | null;
      className?: string;
    };

const BUCKET_FILL: Record<string, string> = {
  "0-30": "bg-aging-0-30",
  "31-60": "bg-aging-31-60",
  "60+": "bg-aging-older",
};

const BUCKET_LABEL: Record<string, string> = {
  "0-30": "0–30 days",
  "31-60": "31–60 days",
  "60+": "60+ days",
};

/**
 * One aging language in two data modes:
 * - proportional: Home's aggregate rupees per bucket (accurate).
 * - bucket: a customer's oldest unpaid credit (categorical, because the API
 *   does not expose per-customer rupees per bucket).
 */
export function AgingStrip(props: AgingStripProps) {
  if (props.mode === "proportional") {
    const total = AGE_BUCKETS.reduce((sum, bucket) => sum + props.buckets[bucket], 0);
    const segments = agingSegments(props.buckets).filter(
      (segment) => segment.amount > 0,
    );

    return (
      <View
        className={cn("h-1 w-full flex-row gap-[3px] overflow-hidden", props.className)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Aging: ${AGE_BUCKETS.map(
          (bucket) => `${BUCKET_LABEL[bucket]} ${props.buckets[bucket]} rupees`,
        ).join(", ")}`}
      >
        {total <= 0 ? (
          <View className="h-1 flex-1 rounded-full bg-line" />
        ) : (
          segments.map((segment) => (
            <View
              key={segment.bucket}
              className={cn("h-1 rounded-full", BUCKET_FILL[segment.bucket])}
              style={{ flex: segment.fraction }}
            />
          ))
        )}
      </View>
    );
  }

  const active = ageBucket(props.ageDays);

  return (
    <View
      className={cn("h-1 w-full flex-row gap-[3px]", props.className)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        active ? `Oldest unpaid credit is ${BUCKET_LABEL[active]} old` : "No unpaid credit"
      }
    >
      {AGE_BUCKETS.map((bucket) => (
        <View
          key={bucket}
          className={cn(
            "h-1 flex-1 rounded-full",
            active === bucket ? BUCKET_FILL[bucket] : "bg-line",
          )}
        />
      ))}
    </View>
  );
}

export function AgingLegend({ className }: { className?: string }) {
  return (
    <View className={cn("flex-row items-center gap-3", className)}>
      {AGE_BUCKETS.map((bucket) => (
        <View key={bucket} className="flex-row items-center gap-1">
          <View className={cn("h-1.5 w-1.5 rounded-full", BUCKET_FILL[bucket])} />
          <Text className="font-mukta-medium text-[11px] text-ink-muted">
            {BUCKET_LABEL[bucket]}
          </Text>
        </View>
      ))}
    </View>
  );
}
