import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Plus, Printer, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ChecklistItemRow } from "@/components/checklist/ChecklistItemRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import {
  getOrCreateChecklist,
  resetChecklistToPersonalized,
  saveChecklist,
  type ChecklistRow,
} from "@/services/checklist";
import { CHECKLIST_CATEGORY_ORDER, CHECKLIST_ITEM_MAX_LEN, STALE_TIME_MS } from "@/config/constants";
import type { ChecklistItem } from "@/types";

export default function Checklist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileQuery = useProfile();

  const query = useQuery<ChecklistRow>({
    queryKey: ["checklist", user?.id],
    queryFn: () => getOrCreateChecklist(user!.id, profileQuery.data ?? null),
    enabled: !!user && !profileQuery.isLoading,
    staleTime: STALE_TIME_MS.short,
  });

  const mutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items: ChecklistItem[] }) => saveChecklist(id, items),
    onError: (err) => toast({
      title: "Couldn't save",
      description: err instanceof Error ? err.message : "Retry",
      variant: "destructive",
    }),
  });

  const [newLabel, setNewLabel] = useState("");

  // Stable callback references let the memoized `ChecklistItemRow` skip re-render
  // for rows whose item object didn't change during a toggle.
  const toggle = useCallback((item: ChecklistItem) => {
    const data = queryClient.getQueryData<ChecklistRow>(["checklist", user?.id]);
    if (!data) return;
    const items = data.items.map(i => i.id === item.id ? { ...i, done: !i.done } : i);
    queryClient.setQueryData<ChecklistRow>(["checklist", user?.id], { ...data, items });
    mutation.mutate({ id: data.id, items });
  }, [queryClient, mutation, user?.id]);

  const removeItem = useCallback((id: string) => {
    const data = queryClient.getQueryData<ChecklistRow>(["checklist", user?.id]);
    if (!data) return;
    const items = data.items.filter(i => i.id !== id);
    queryClient.setQueryData<ChecklistRow>(["checklist", user?.id], { ...data, items });
    mutation.mutate({ id: data.id, items });
  }, [queryClient, mutation, user?.id]);

  const addCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label || !query.data) return;
    if (label.length > CHECKLIST_ITEM_MAX_LEN) {
      toast({
        title: "Too long",
        description: `Keep items under ${CHECKLIST_ITEM_MAX_LEN} characters.`,
        variant: "destructive",
      });
      return;
    }
    const items = [...query.data.items, { id: crypto.randomUUID(), label, category: "Custom", done: false }];
    queryClient.setQueryData<ChecklistRow>(["checklist", user?.id], { ...query.data, items });
    mutation.mutate({ id: query.data.id, items });
    setNewLabel("");
  };

  const resetToPersonalized = async () => {
    if (!query.data) return;
    const items = await resetChecklistToPersonalized(query.data.id, profileQuery.data ?? null);
    queryClient.setQueryData<ChecklistRow>(["checklist", user?.id], { ...query.data, items });
    toast({ title: "Checklist rebuilt", description: "Regenerated from your current household profile." });
  };

  const grouped = useMemo(() => {
    const items = query.data?.items ?? [];
    const map = items.reduce<Record<string, ChecklistItem[]>>((acc, it) => {
      (acc[it.category] ||= []).push(it);
      return acc;
    }, {});
    const ordered: [string, ChecklistItem[]][] = CHECKLIST_CATEGORY_ORDER
      .filter(c => map[c]?.length)
      .map(c => [c, map[c]]);
    const extras: [string, ChecklistItem[]][] = Object.entries(map)
      .filter(([c]) => !(CHECKLIST_CATEGORY_ORDER as readonly string[]).includes(c));
    return [...ordered, ...extras];
  }, [query.data]);

  const totalDone = (query.data?.items ?? []).filter(i => i.done).length;
  const total = query.data?.items.length ?? 0;

  return (
    <AppShell>
      <div className="max-w-3xl space-y-16 print:space-y-6">
        <header className="print:hidden">
          <p className="uppercase-label text-muted-foreground mb-6">Your kit</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.05]">
            A checklist <em>shaped by your household.</em>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl font-light">
            Items appear based on who lives with you and the kind of home you're in. Toggle as you go — progress saves automatically.
          </p>
        </header>

        <header className="hidden print:block">
          <h2 className="font-serif text-3xl">Varsham — Emergency checklist</h2>
          <p className="text-sm mt-1">
            {profileQuery.data?.locality ?? profileQuery.data?.city ?? "Household"} · Printed {new Date().toLocaleDateString()}
          </p>
        </header>

        {query.isLoading || profileQuery.isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : query.isError ? (
          <EmptyState title="Couldn't load your checklist" description="Please refresh the page." />
        ) : total === 0 ? (
          <EmptyState icon={<ListChecks className="h-8 w-8" />} title="No items yet" description="Your checklist is empty." />
        ) : (
          <>
            <section className="border-t border-border pt-8 flex items-end justify-between gap-6 flex-wrap print:hidden">
              <div>
                <p className="uppercase-label text-muted-foreground mb-3">Overall progress</p>
                <p className="font-serif text-4xl">
                  {totalDone}<span className="text-muted-foreground"> / {total}</span>
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="ghost" size="sm" onClick={resetToPersonalized} className="uppercase-label gap-2">
                  <RotateCcw className="h-3 w-3" strokeWidth={1.5} /> Rebuild from profile
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="uppercase-label gap-2">
                  <Printer className="h-3 w-3" strokeWidth={1.5} /> Print / export
                </Button>
              </div>
            </section>

            <form onSubmit={addCustom} className="border-t border-border pt-8 print:hidden">
              <p className="uppercase-label text-muted-foreground mb-4">Add your own</p>
              <div className="flex gap-2">
                <Input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="e.g. Refill inhaler prescription"
                  maxLength={CHECKLIST_ITEM_MAX_LEN}
                  className="rounded-none border-0 border-b border-border focus-visible:ring-0 focus-visible:border-foreground px-0"
                />
                <Button type="submit" variant="ghost" size="sm" className="uppercase-label gap-2" disabled={!newLabel.trim()}>
                  <Plus className="h-3 w-3" strokeWidth={1.5} /> Add
                </Button>
              </div>
            </form>

            <div className="space-y-14">
              {grouped.map(([category, items]) => (
                <section key={category} className="border-t border-border pt-8">
                  <p className="uppercase-label text-muted-foreground mb-6">{category}</p>
                  <ul className="space-y-4">
                    {items.map(item => (
                      <ChecklistItemRow
                        key={item.id}
                        item={item}
                        removable={category === "Custom"}
                        onToggle={toggle}
                        onRemove={removeItem}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
