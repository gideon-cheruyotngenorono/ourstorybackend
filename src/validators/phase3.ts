import { z } from "zod";

export const idSchema = z.object({ id: z.string() });

// ML-CHAT Validation
export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  type: z.enum(["text", "image", "voice", "sticker"]).default("text"),
});

export const editMessageSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "Message content is required"),
});

// ML-NOTES Validation
export const noteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Note content cannot be empty"),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().default(false),
});

export const updateNoteSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().min(1, "Note content cannot be empty"),
});

// ML-LETTER Validation
export const letterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Letter cannot be empty"),
  deliverAt: z.string(), // ISO date string
  isDraft: z.boolean().default(true),
});

export const updateLetterSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  deliverAt: z.string().optional(), // ISO date string
  isDraft: z.boolean().optional(),
});

// ML-PRAYER Validation
export const prayerSchema = z.object({
  content: z.string().min(1, "Prayer content is required"),
  category: z.enum(["Family", "Relationship", "Career", "Health", "Gratitude"]).default("Relationship"),
});

// ML-REFLECTION Validation
export const reflectionSchema = z.object({
  content: z.string().min(1, "Reflection content cannot be empty"),
  date: z.string(), // ISO date string
  isShared: z.boolean().default(false),
});
