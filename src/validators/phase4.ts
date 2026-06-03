import { z } from "zod";

export const idSchema = z.object({ id: z.string() });

// ML-GRATITUDE Validation
export const gratitudeSchema = z.object({
  content: z.string().min(1, "Gratitude content is required"),
  date: z.string(), // ISO String
  isShared: z.boolean().default(true),
});

export const updateGratitudeSchema = z.object({
  id: z.string(),
  content: z.string().optional(),
  date: z.string().optional(),
  isShared: z.boolean().optional(),
});

// ML-JAR Validation
export const jarReasonSchema = z.object({
  content: z.string().min(1, "Reason is required"),
  category: z.string().optional(),
});

// ML-TIMELINE Validation
export const timelineEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string(),
  type: z.enum(["Photo", "Note", "Prayer milestone", "Relationship milestone", "Special event"]),
  mediaUrl: z.string().optional(),
});
