import { Text, type TextProps } from "react-native";
import { formatCurrency } from "@/types/database";
import { cn } from "@/lib/cn";

type MoneyTone = "default" | "dark" | "positive" | "danger" | "muted";

interface MoneyTextProps {
  value: number;
  tone?: MoneyTone;
  sign?: "+" | "-";
  size?: "inline" | "body" | "title" | "hero";
  className?: string;
  numberOfLines?: TextProps["numberOfLines"];
  adjustsFontSizeToFit?: boolean;
  /** Floor for `adjustsFontSizeToFit` so a long amount shrinks instead of clipping. */
  minimumFontScale?: number;
}

const TONE_CLASS: Record<MoneyTone, string> = {
  default: "text-ink",
  dark: "text-[#0A0A0A]",
  positive: "text-positive",
  danger: "text-danger-text",
  muted: "text-ink-muted",
};

const SIZE_CLASS = {
  inline: "text-[15px] leading-5 font-mukta-bold",
  body: "text-[15px] leading-[22px] font-mukta-semibold",
  title: "text-[24px] leading-[30px] font-mukta-bold",
  hero: "text-[34px] leading-[38px] font-mukta-black tracking-[-0.5px]",
} as const;

export function MoneyText({
  value,
  tone = "default",
  sign,
  size = "inline",
  className,
  numberOfLines,
  adjustsFontSizeToFit,
  minimumFontScale,
}: MoneyTextProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      className={cn(SIZE_CLASS[size], TONE_CLASS[tone], className)}
      style={{ fontVariant: ["tabular-nums"] }}
    >
      {sign ?? ""}
      {formatCurrency(Math.abs(value))}
    </Text>
  );
}
