import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Status, Priority, STATUS_LABELS, PRIORITY_LABELS } from "@/types/ticket";
import { getStatusColor, getStatusDot, getPriorityBg } from "@/lib/ticket-utils";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border", getStatusColor(status))}>
      <span className={cn("h-1.5 w-1.5 rounded-full", getStatusDot(status))} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border", getPriorityBg(priority))}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
      {label}
    </span>
  );
}
