import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomerSearch({
  value,
  onChange,
}: CustomerSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

      <Input
        placeholder="Search by name or phone..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}