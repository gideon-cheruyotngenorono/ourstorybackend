import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  displayName: z.string().min(2, "Display name must be at least 2 characters long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address format"),
  password: z.string().min(1, "Password is required"),
});

export const createCoupleSchema = z.object({
  partnerEmail: z.string().email("Partner email format invalid").optional(),
  anniversaryDate: z.string().optional(),
});
