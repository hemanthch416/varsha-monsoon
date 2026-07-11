import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { appendChat, listChat } from "@/services/chat";
import { chatMessageSchema } from "@/utils/schemas";
import { cn } from "@/lib/utils";

const suggestions = [
  "What should I keep in my emergency kit?",
  "How do I prepare my ground-floor flat for flooding?",
  "What to do if the roads flood on my commute?",
];

export default function Assistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatQuery = useQuery({
    queryKey: ["chat", user?.id],
    queryFn: () => listChat(user!.id),
    enabled: !!user,
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      // Placeholder — real AI call will be wired to an edge function later.
      await appendChat(user!.id, "user", message);
      await new Promise(r => setTimeout(r, 400));
      await appendChat(user!.id, "assistant",
        "I'll help with monsoon preparedness once the AI service is connected. In the meantime, check the Checklist for personalized preparation steps.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", user?.id] }),
    onError: (err) => toast({
      title: "Message failed",
      description: err instanceof Error ? err.message : "Try again",
      variant: "destructive",
    }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatQuery.data]);

  const send = (text: string) => {
    const parsed = chatMessageSchema.safeParse({ message: text });
    if (!parsed.success) return;
    sendMutation.mutate(parsed.data.message);
    setInput("");
  };

  const messages = chatQuery.data ?? [];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        <header className="mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">Ask preparedness questions in your language.</p>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl border bg-card p-4 md:p-6 space-y-4">
          {chatQuery.isLoading ? (
            <div className="space-y-3"><Skeleton className="h-16 w-2/3" /><Skeleton className="h-16 w-1/2 ml-auto" /></div>
          ) : chatQuery.isError ? (
            <EmptyState title="Couldn't load conversation" description="Please refresh." />
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-6">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">How can I help you today?</p>
                <p className="text-sm text-muted-foreground max-w-sm">Try one of the prompts below to get started.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map(s => (
                  <button key={s} onClick={() => send(s)} className="text-xs border rounded-full px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Sparkles className="h-3 w-3 inline mr-1" /> {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(m => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  {m.message}
                </div>
              </div>
            ))
          )}
          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm text-muted-foreground">Thinking…</div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="mt-4 flex gap-2"
        >
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about preparedness, alerts, or safety…" />
          <Button type="submit" disabled={!input.trim() || sendMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
