import type { Severity } from "@/types";
import { severityBadgeClass, severityLabel } from "@/utils/severity";
import { cn } from "@/lib/utils";

interface Props { severity: Severity; className?: string }

export function SeverityBadge({ severity, className }: Props) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      severityBadgeClass[severity],
      className,
    )}>
      {severityLabel[severity]}
    </span>
  );
}
