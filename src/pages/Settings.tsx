import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { updateSettings } from "@/services/profile";
import { settingsSchema, housingTypes, languages, type SettingsInput } from "@/utils/schemas";
import { housingLabels, languageLabels } from "@/config/labels";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const profileQuery = useProfile();

  const [form, setForm] = useState<SettingsInput | null>(null);

  useEffect(() => {
    if (profileQuery.data && !form) {
      const p = profileQuery.data;
      setForm({
        city: p.city ?? "",
        locality: p.locality ?? "",
        household_size: p.household_size,
        has_elderly: p.has_elderly,
        has_children: p.has_children,
        has_pets: p.has_pets,
        housing_type: (p.housing_type ?? "ground_floor") as SettingsInput["housing_type"],
        language: (p.language ?? "en") as SettingsInput["language"],
        notifications_enabled: p.notifications_enabled,
      });
    }
  }, [profileQuery.data, form]);

  const mutation = useMutation({
    mutationFn: (input: SettingsInput) => updateSettings(user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({ title: "Settings saved" });
    },
    onError: (err) => toast({
      title: "Couldn't save",
      description: err instanceof Error ? err.message : "Retry",
      variant: "destructive",
    }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const parsed = settingsSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Check the form", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    mutation.mutate(parsed.data);
  };

  return (
    <AppShell>
      <div className="max-w-2xl space-y-8">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Update your household profile and notification preferences.</p>
        </header>

        {profileQuery.isLoading || !form ? (
          <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : profileQuery.isError ? (
          <EmptyState title="Couldn't load your profile" description="Please refresh." />
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <section className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="font-medium">Location</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locality">Locality</Label>
                  <Input id="locality" value={form.locality} onChange={e => setForm({ ...form, locality: e.target.value })} />
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="font-medium">Household</h3>
              <div className="space-y-2">
                <Label htmlFor="hs">Household size</Label>
                <Input id="hs" type="number" min={1} max={30} value={form.household_size} onChange={e => setForm({ ...form, household_size: Number(e.target.value) })} />
              </div>
              <div className="space-y-3">
                {([["has_elderly","Elderly members"],["has_children","Children"],["has_pets","Pets"]] as const).map(([key,label]) => (
                  <label key={key} className="flex items-center gap-3 text-sm">
                    <Checkbox checked={form[key]} onCheckedChange={(v) => setForm({ ...form, [key]: !!v })} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Housing type</Label>
                <Select value={form.housing_type} onValueChange={(v) => setForm({ ...form, housing_type: v as SettingsInput["housing_type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{housingTypes.map(h => <SelectItem key={h} value={h}>{housingLabels[h]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="font-medium">Preferences</h3>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v as SettingsInput["language"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{languages.map(l => <SelectItem key={l} value={l}>{languageLabels[l]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Alert notifications</p>
                  <p className="text-xs text-muted-foreground">Get notified about alerts in your area.</p>
                </div>
                <Switch checked={form.notifications_enabled} onCheckedChange={(v) => setForm({ ...form, notifications_enabled: v })} />
              </div>
            </section>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
