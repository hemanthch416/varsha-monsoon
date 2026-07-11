import type { Language } from "@/types";

export const languageLabels: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  te: "తెలుగు",
};

export const languageOptions: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { value: "te", label: "తెలుగు (Telugu)" },
];
