import { memo, useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateChecklist, resetChecklistToPersonalized, saveChecklist, type ChecklistRow } from "@/services/checklist";
import { getProfile } from "@/services/profile";
import type { ChecklistItem } from "@/types";

const CATEGORY_ORDER = ["Essentials", "Power", "Documents", "Health", "Safety", "Contacts", "Elderly", "Children", "Pets", "Home", "Custom"];

export default function Checklist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
    // Household profile changes rarely; avoid refetching on every mount / page switch.
    staleTime: 5 * 60_000,
  });

  const query = useQuery<ChecklistRow>({
    queryKey: ["checklist", user?.id],
    queryFn: () => getOrCreateChecklist(user!.id, profileQuery.data ?? null),
    enabled: !!user && !profileQuery.isLoading,
    staleTime: 60_000,
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

  const updateItems = (items: ChecklistItem[]) => {
    if (!query.data) return;
    queryClient.setQueryData<ChecklistRow>(["checklist", user?.id], { ...query.data, items });
    mutation.mutate({ id: query.data.id, items });
  };

  const toggle = (item: ChecklistItem) => {
    if (!query.data) return;
    updateItems(query.data.items.map(i => i.id === item.id ? { ...i, done: !i.done } : i));
  };

  const addCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label || !query.data) return;
    if (label.length > 140) {
      toast({ title: "Too long", description: "Keep items under 140 characters.", variant: "destructive" });
      return;
    }
    updateItems([...query.data.items, { id: crypto.randomUUID(), label, category: "Custom", done: false }]);
    setNewLabel("");
  };

  const removeItem = (id: string) => {
    if (!query.data) return;
    updateItems(query.data.items.filter(i => i.id !== id));
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
    // Order categories consistently
    return CATEGORY_ORDER
      .filter(c => map[c]?.length)
      .map(c => [c, map[c]] as const)
      .concat(Object.entries(map).filter(([c]) => !CATEGORY_ORDER.includes(c)));
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

        {/* Print-only header */}
        <header className="hidden print:block">
          <h2 className="font-serif text-3xl">Varsha — Emergency checklist</h2>
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
            {/* Progress + actions */}
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

            {/* Add custom */}
            <form onSubmit={addCustom} className="border-t border-border pt-8 print:hidden">
              <p className="uppercase-label text-muted-foreground mb-4">Add your own</p>
              <div className="flex gap-2">
                <Input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="e.g. Refill inhaler prescription"
                  maxLength={140}
                  className="rounded-none border-0 border-b border-border focus-visible:ring-0 focus-visible:border-foreground px-0"
                />
                <Button type="submit" variant="ghost" size="sm" className="uppercase-label gap-2" disabled={!newLabel.trim()}>
                  <Plus className="h-3 w-3" strokeWidth={1.5} /> Add
                </Button>
              </div>
            </form>

            {/* Grouped items */}
            <div className="space-y-14">
              {grouped.map(([category, items]) => (
                <section key={category} className="border-t border-border pt-8">
                  <p className="uppercase-label text-muted-foreground mb-6">{category}</p>
                  <ul className="space-y-4">
                    {items.map(item => (
                      <li key={item.id} className="group flex items-start gap-4">
                        <Checkbox
                          checked={item.done}
                          onCheckedChange={() => toggle(item)}
                          id={item.id}
                          className="mt-1 print:hidden"
                        />
                        <span className="hidden print:inline mt-0.5">☐</span>
                        <label
                          htmlFor={item.id}
                          className={`flex-1 text-sm md:text-base leading-relaxed cursor-pointer ${item.done ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.label}
                        </label>
                        {category === "Custom" && (
                          <button
                            onClick={() => removeItem(item.id)}
                            aria-label="Remove"
                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition print:hidden"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </li>
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
