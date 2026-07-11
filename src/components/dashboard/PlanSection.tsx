import { RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_SECTIONS } from "@/config/labels";
import { cn } from "@/lib/utils";
import type { UseQueryResult } from "@tanstack/react-query";
import type { PreparednessPlan } from "@/types";

interface Props {
  planQuery: UseQueryResult<PreparednessPlan, Error>;
  onRegenerate: () => void;
  dimmed: boolean;
}

export function PlanSection({ planQuery, onRegenerate, dimmed }: Props) {
  return (
    <section className={cn("border-t border-border pt-8", dimmed && "opacity-60")}>
      <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
        <div>
          <p className="uppercase-label text-muted-foreground mb-4">Your plan</p>
          <h3 className="font-serif text-3xl md:text-4xl">Prepared for <em>your</em> home.</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={planQuery.isFetching}
          className="uppercase-label text-muted-foreground hover:text-foreground gap-2"
        >
          <RefreshCw className={`h-3 w-3 ${planQuery.isFetching ? "animate-spin" : ""}`} strokeWidth={1.5} />
          Regenerate
        </Button>
      </div>

      {planQuery.isLoading ? (
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : planQuery.isError ? (
        <EmptyState
          title="Couldn't generate your plan"
          description={planQuery.error instanceof Error ? planQuery.error.message : "Please try again."}
          action={<Button variant="outline" onClick={onRegenerate}>Try again</Button>}
        />
      ) : planQuery.data ? (
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-14">
          {PLAN_SECTIONS.map(section => (
            <article key={section.key}>
              <p className="uppercase-label text-muted-foreground mb-3">{section.title}</p>
              <p className="font-serif text-xl mb-5 italic text-muted-foreground">{section.body}</p>
              <ul className="space-y-3">
                {planQuery.data![section.key].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="text-muted-foreground font-serif">{String(i + 1).padStart(2, "0")}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No plan yet" description="Complete onboarding to generate one." />
      )}
    </section>
  );
}
