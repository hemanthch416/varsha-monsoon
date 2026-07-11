import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateChecklist, saveChecklist } from "@/services/checklist";
import type { ChecklistItem } from "@/types";

export default function Checklist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["checklist", user?.id],
    queryFn: () => getOrCreateChecklist(user!.id),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items: ChecklistItem[] }) => saveChecklist(id, items),
    onError: (err) => toast({
      title: "Couldn't save",
      description: err instanceof Error ? err.message : "Retry",
      variant: "destructive",
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checklist", user?.id] }),
  });

  const grouped = useMemo(() => {
    const items = query.data?.items ?? [];
    return items.reduce<Record<string, ChecklistItem[]>>((acc, it) => {
      (acc[it.category] ||= []).push(it);
      return acc;
    }, {});
  }, [query.data]);

  const toggle = (item: ChecklistItem) => {
    if (!query.data) return;
    const next = query.data.items.map(i => i.id === item.id ? { ...i, done: !i.done } : i);
    // Optimistic pattern via cache would work too; keeping simple here.
    mutation.mutate({ id: query.data.id, items: next });
    queryClient.setQueryData(["checklist", user?.id], { ...query.data, items: next });
  };

  const totalDone = (query.data?.items ?? []).filter(i => i.done).length;
  const total = query.data?.items.length ?? 0;

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight">Emergency checklist</h2>
          <p className="text-sm text-muted-foreground mt-1">Track your household preparation. Progress is saved automatically.</p>
        </header>

        {query.isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : query.isError ? (
          <EmptyState title="Couldn't load your checklist" description="Please refresh the page." />
        ) : total === 0 ? (
          <EmptyState icon={<ListChecks className="h-8 w-8" />} title="No items yet" description="Your checklist is empty." />
        ) : (
          <>
            <div className="rounded-xl border bg-card p-4 shadow-soft flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall progress</p>
                <p className="text-2xl font-semibold">{totalDone} / {total}</p>
              </div>
              <div className="w-40">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${total ? (totalDone/total)*100 : 0}%` }} />
                </div>
              </div>
            </div>

            {Object.entries(grouped).map(([category, items]) => (
              <section key={category}>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{category}</h3>
                <ul className="rounded-xl border bg-card divide-y">
                  {items.map(item => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <Checkbox checked={item.done} onCheckedChange={() => toggle(item)} id={item.id} />
                      <label htmlFor={item.id} className={`text-sm cursor-pointer flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>
                        {item.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </AppShell>
  );
}
