import { z } from "zod";

/** Shared by the Credentials provider's authorize() and the login form action. */
export const credentialsSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().trim().max(100, "Name is too long").optional(),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** Board Key: up to 4 uppercase letters, mutable. See CONTEXT.md. */
export const boardKeySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{1,4}$/, "Key must be 1–4 uppercase letters");

export const boardNameSchema = z
  .string()
  .trim()
  .min(1, "Board name is required")
  .max(60, "Name is too long");

export const createBoardSchema = z.object({
  name: boardNameSchema,
  key: boardKeySchema,
});

export const updateBoardSchema = z.object({
  name: boardNameSchema,
  key: boardKeySchema,
});

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Tag name is required")
  .max(40, "Name is too long");

export const stickyColors = [
  "yellow",
  "pink",
  "blue",
  "green",
  "orange",
  "purple",
] as const;

export const stickyColorSchema = z.enum(stickyColors);

export const createTagSchema = z.object({
  name: tagNameSchema,
  color: stickyColorSchema,
});

export const ticketStatuses = [
  "todo",
  "in_progress",
  "blocked",
  "closed",
] as const;

export const ticketStatusSchema = z.enum(ticketStatuses);

export const ticketTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title is too long");

export const createTicketSchema = z.object({
  title: ticketTitleSchema,
  description: z.string().max(20000, "Description is too long").optional(),
  color: stickyColorSchema.optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateTicketSchema = z.object({
  title: ticketTitleSchema.optional(),
  description: z.string().max(20000, "Description is too long").optional(),
  color: stickyColorSchema.optional(),
  status: ticketStatusSchema.optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateBodySchema = z
  .string()
  .trim()
  .min(1, "Update cannot be empty")
  .max(20000, "Update is too long");

export const createUpdateSchema = z.object({
  body: updateBodySchema,
});

export const editUpdateSchema = z.object({
  body: updateBodySchema,
});
