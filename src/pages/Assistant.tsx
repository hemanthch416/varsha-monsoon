import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { listChat } from "@/services/chat";
import { askAssistant } from "@/services/ai";
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
    mutationFn: (message: string) => askAssistant(message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", user?.id] }),
    onError: (err) => toast({
      title: "Assistant unavailable",
      description: err instanceof Error ? err.message : "Try again",
      variant: "destructive",
    }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatQuery.data, sendMutation.isPending]);

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
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="uppercase-label text-muted-foreground mb-2">Ask Varsha</p>
            <h2 className="font-serif text-3xl md:text-4xl">
              A calm second <em>opinion</em>, in your language.
            </h2>
          </div>
          <LanguageSwitcher />
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto border-t border-border py-8 space-y-6">
          {chatQuery.isLoading ? (
            <div className="space-y-3"><Skeleton className="h-16 w-2/3" /><Skeleton className="h-16 w-1/2 ml-auto" /></div>
          ) : chatQuery.isError ? (
            <EmptyState title="Couldn't load conversation" description="Please refresh." />
          ) : messages.length === 0 && !sendMutation.isPending ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-8 py-16">
              <MessageSquare className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              <p className="font-serif text-2xl md:text-3xl italic max-w-md">What weighs on you today?</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestions.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="uppercase-label text-muted-foreground border border-border rounded-full px-4 py-2 hover:text-foreground hover:border-foreground transition">
                    <Sparkles className="h-3 w-3 inline mr-1.5" strokeWidth={1.5} />{s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(m => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed",
                  m.role === "user" ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"
                )}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-strong:text-foreground">
                      <ReactMarkdown>{m.message}</ReactMarkdown>
                    </div>
                  ) : m.message}
                </div>
              </div>
            ))
          )}
          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-secondary text-muted-foreground rounded-2xl px-5 py-3 text-sm italic">Thinking…</div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-6 flex gap-2 border-t border-border pt-6">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-6 flex gap-2 border-t border-border pt-6" aria-label="Send a message to the assistant">
          <label htmlFor="assistant-input" className="sr-only">Your question</label>
          <Input id="assistant-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about preparedness, alerts, or safety…"
            className="border-0 bg-secondary rounded-full px-5 h-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          <Button type="submit" disabled={!input.trim() || sendMutation.isPending} aria-label="Send message"
            className="rounded-full h-11 px-5 bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
