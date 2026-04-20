import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KycStatus } from "@/lib/types";

const STATUS_STYLES: Record<KycStatus, string> = {
  PENDING: "border-slate-200 bg-slate-100 text-slate-700",
  PROCESSING: "border-sky-200 bg-sky-50 text-sky-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MANUAL_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusBadge({ status }: { status: KycStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em]",
        STATUS_STYLES[status],
      )}
    >
      {status.split("_").join(" ")}
    </Badge>
  );
}
