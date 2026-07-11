import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getProfile } from "@/services/profile";
import { languageOptions } from "@/utils/languages";
import type { Language } from "@/types";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Compact language switcher that updates the profile in place and invalidates
// language-scoped queries (plan, chat) so the UI refetches in the new language.
export function LanguageSwitcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile", user?.id], queryFn: () => getProfile(user!.id), enabled: !!user });

  const mutation = useMutation({
    mutationFn: async (language: Language) => {
      const { error } = await supabase.from("profiles").update({ language }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: (_, language) => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      toast({ title: "Language updated", description: languageOptions.find(o => o.value === language)?.label });
    },
    onError: (err) => toast({
      title: "Couldn't update language",
      description: err instanceof Error ? err.message : "Try again",
      variant: "destructive",
    }),
  });

  const current = profileQuery.data?.language ?? "en";
  const currentLabel = languageOptions.find(o => o.value === current)?.label ?? "English";

  // Sync <html lang> so screen readers use correct pronunciation for the user's language.
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = current;
  }, [current]);


  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Change language, current language ${currentLabel}`}
        className="inline-flex items-center gap-2 uppercase-label text-muted-foreground hover:text-foreground transition border border-border rounded-full px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span>{currentLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" strokeWidth={1.5} aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {languageOptions.map(opt => (
          <DropdownMenuItem key={opt.value} onClick={() => mutation.mutate(opt.value)} className="flex items-center justify-between gap-4">
            {opt.label}
            {current === opt.value && <Check className="h-3.5 w-3.5" strokeWidth={1.5} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
