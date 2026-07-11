import type { Language } from "@/types";

export const languageLabels: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  te: "తెలుగు",
  ta: "தமிழ்",
  ml: "മലയാളം",
  bn: "বাংলা",
};

export const languageOptions: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "ml", label: "മലയാളം (Malayalam)" },
  { value: "bn", label: "বাংলা (Bengali)" },
];
