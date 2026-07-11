import type { Severity } from "@/types";

export const severityLabel: Record<Severity, string> = {
  normal: "Normal",
  watch: "Watch",
  warning: "Warning",
  severe: "Severe",
  emergency: "Emergency",
};

export const severityBadgeClass: Record<Severity, string> = {
  normal: "bg-severity-normal text-severity-normal-foreground",
  watch: "bg-severity-watch text-severity-watch-foreground",
  warning: "bg-severity-warning text-severity-warning-foreground",
  severe: "bg-severity-severe text-severity-severe-foreground",
  emergency: "bg-severity-emergency text-severity-emergency-foreground",
};

export const severityBorderClass: Record<Severity, string> = {
  normal: "border-severity-normal/40",
  watch: "border-severity-watch/50",
  warning: "border-severity-warning/60",
  severe: "border-severity-severe/70",
  emergency: "border-severity-emergency/80",
};

export const severityRank: Record<Severity, number> = {
  normal: 0, watch: 1, warning: 2, severe: 3, emergency: 4,
};
