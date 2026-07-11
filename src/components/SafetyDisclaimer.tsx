import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Required disclaimer that must accompany every AI- or rule-generated
// safety recommendation. Content is factual and non-alarmist.
export function SafetyDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn(
      "flex items-start gap-2 text-xs text-muted-foreground/80 leading-relaxed font-light",
      className,
    )}>
      <Info className="h-3 w-3 mt-0.5 shrink-0" strokeWidth={1.5} />
      <span>
        General guidance only — not a substitute for instructions from official
        emergency services. In an emergency, dial <a href="tel:112" className="font-medium text-foreground hover:underline">112</a>.
      </span>
    </p>
  );
}
