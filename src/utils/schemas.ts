import { z } from "zod";

export const housingTypes = ["ground_floor", "high_rise", "near_river", "low_lying", "other"] as const;
export const languages = ["en", "hi", "mr", "ta", "bn"] as const;

export const onboardingSchema = z.object({
  city: z.string().trim().min(2, "City is required").max(80),
  locality: z.string().trim().min(2, "Locality is required").max(120),
  household_size: z.number().int().min(1).max(30),
  has_elderly: z.boolean(),
  has_children: z.boolean(),
  has_pets: z.boolean(),
  housing_type: z.enum(housingTypes),
  language: z.enum(languages),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const settingsSchema = onboardingSchema.extend({
  notifications_enabled: z.boolean(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const travelQuerySchema = z.object({
  origin: z.string().trim().min(2).max(80),
  destination: z.string().trim().min(2).max(80),
});
export type TravelQueryInput = z.infer<typeof travelQuerySchema>;

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1, "Message required").max(2000),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
