import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { completeOnboarding } from "@/services/profile";
import { onboardingSchema, housingTypes, languages, type OnboardingInput } from "@/utils/schemas";
import { housingLabels, languageLabels } from "@/config/labels";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<OnboardingInput>({
    city: "", locality: "", household_size: 2,
    has_elderly: false, has_children: false, has_pets: false,
    housing_type: "ground_floor", language: "en",
  });

  const mutation = useMutation({
    mutationFn: (input: OnboardingInput) => completeOnboarding(user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      navigate("/dashboard");
    },
    onError: (err) => toast({
      title: "Could not save",
      description: err instanceof Error ? err.message : "Try again",
      variant: "destructive",
    }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = onboardingSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Check the form", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    mutation.mutate(parsed.data);
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-sky flex items-center justify-center">
            <Cloud className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Varsham</span>
        </div>
        <h1 className="text-2xl font-semibold mb-2">Tell us about your household</h1>
        <p className="text-sm text-muted-foreground mb-8">We'll use this to personalize your preparedness plan and alerts.</p>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locality">Locality</Label>
              <Input id="locality" value={form.locality} onChange={e => setForm({ ...form, locality: e.target.value })} placeholder="Andheri West" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="household_size">Household size</Label>
            <Input id="household_size" type="number" min={1} max={30}
              value={form.household_size}
              onChange={e => setForm({ ...form, household_size: Number(e.target.value) })} />
          </div>

          <div className="space-y-3">
            <Label>In the household</Label>
            {([["has_elderly", "Elderly members"], ["has_children", "Children"], ["has_pets", "Pets"]] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 text-sm">
                <Checkbox checked={form[key]} onCheckedChange={(v) => setForm({ ...form, [key]: !!v })} />
                {label}
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Housing type</Label>
            <Select value={form.housing_type} onValueChange={(v) => setForm({ ...form, housing_type: v as OnboardingInput["housing_type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {housingTypes.map(h => <SelectItem key={h} value={h}>{housingLabels[h]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Preferred language</Label>
            <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v as OnboardingInput["language"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {languages.map(l => <SelectItem key={l} value={l}>{languageLabels[l]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Continue to dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}
