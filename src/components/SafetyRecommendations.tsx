import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafetyDisclaimer } from "./SafetyDisclaimer";
import { buildSafetyTips, severityTone } from "@/services/safetyRules";
import { askAssistant } from "@/services/ai";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";
import type { AlertState } from "@/utils/alertEngine";

interface Props {
  state: AlertState;
  profile: Profile | null;
}

// Combines rule-based tips (deterministic, always shown) with an optional
// AI deep-dive that reuses the chat-assistant edge function scoped to the
// current alert + household. AI output is rendered under the same disclaimer.
export function SafetyRecommendations({ state, profile }: Props) {
  const tips = buildSafetyTips(state, profile);
  const { toast } = useToast();
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const aiMutation = useMutation({
    mutationFn: () => {
      const prompt = buildAiPrompt(state, profile);
      return askAssistant(prompt);
    },
    onSuccess: (reply) => setAiAnswer(reply),
    onError: (err) => toast({
      title: "Couldn't fetch AI guidance",
      description: err instanceof Error ? err.message : "Try again",
      variant: "destructive",
    }),
  });

  return (
    <section className="border-t border-border pt-8">
      <div className="mb-6">
        <p className="uppercase-label text-muted-foreground mb-4">Safety recommendations</p>
        <h3 className="font-serif text-2xl md:text-3xl">What to do right now.</h3>
        <p className="mt-3 text-muted-foreground max-w-2xl font-light leading-relaxed">
          {severityTone(state.severity)}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
        {tips.map(tip => (
          <article key={tip.id}>
            <p className="uppercase-label text-muted-foreground mb-3">{tip.category}</p>
            <h4 className="font-serif text-xl mb-3">{tip.title}</h4>
            <p className="text-sm leading-relaxed font-light text-foreground/85">{tip.body}</p>
            <p className="mt-3 text-[11px] uppercase-label text-muted-foreground/70">
              Why: {tip.reasons.join(" · ")}
            </p>
          </article>
        ))}
      </div>

      {/* AI deep dive */}
      <div className="mt-14 border-t border-border pt-8">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="uppercase-label text-muted-foreground mb-2">Ask Varsha for more</p>
            <p className="font-serif text-lg italic text-muted-foreground max-w-lg">
              Get AI-tailored guidance for your household and the current alert.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => aiMutation.mutate()}
            disabled={aiMutation.isPending}
            className="uppercase-label gap-2"
          >
            {aiMutation.isPending
              ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
              : <Sparkles className="h-3 w-3" strokeWidth={1.5} />}
            {aiMutation.isPending ? "Generating…" : aiAnswer ? "Regenerate" : "Generate guidance"}
          </Button>
        </div>

        {aiAnswer && (
          <div className="prose prose-sm max-w-none prose-neutral dark:prose-invert font-light">
            <ReactMarkdown>{aiAnswer}</ReactMarkdown>
          </div>
        )}
      </div>

      <SafetyDisclaimer className="mt-10" />
    </section>
  );
}

function buildAiPrompt(state: AlertState, profile: Profile | null): string {
  const flags: string[] = [];
  if (profile?.has_elderly) flags.push("elderly members");
  if (profile?.has_children) flags.push("children");
  if (profile?.has_pets) flags.push("pets");
  const flagStr = flags.length ? flags.join(", ") : "no special-needs members";
  return (
    `Give me 4-6 concise, factual safety recommendations tailored to my situation. ` +
    `Alert status: ${state.status.toUpperCase()} (severity: ${state.severity}). ` +
    `Current headline: "${state.headline}". ` +
    `My household: ${profile?.household_size ?? 1} people including ${flagStr}, ` +
    `housing type: ${profile?.housing_type ?? "unknown"}, located in ${profile?.locality ?? profile?.city ?? "India"}. ` +
    `Keep tone factual and non-alarmist. Use short markdown bullet points. ` +
    `Do not repeat generic advice already common knowledge — focus on what's specific to my situation.`
  );
}
