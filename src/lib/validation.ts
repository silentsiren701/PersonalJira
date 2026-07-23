import { z } from "zod";

/** Shared by the Credentials provider's authorize() and the login form action. */
export const credentialsSchema = z.object({
  email: z.string().trim().email("邮箱格式不对"),
  password: z.string().min(1, "请输入密码"),
});

export const registerSchema = z.object({
  name: z.string().trim().max(100, "名字太长了").optional(),
  email: z.string().trim().toLowerCase().email("邮箱格式不对"),
  password: z.string().min(8, "密码至少 8 位"),
});

/** Board Key: up to 4 uppercase letters, mutable. See CONTEXT.md. */
export const boardKeySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{1,4}$/, "Key 只能是 1-4 位大写字母");

export const boardNameSchema = z
  .string()
  .trim()
  .min(1, "请输入 Board 名称")
  .max(60, "名称太长了");

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
  .min(1, "请输入 Tag 名称")
  .max(40, "名称太长了");

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
  "not_started",
  "in_progress",
  "blocked",
  "closed",
] as const;

export const ticketStatusSchema = z.enum(ticketStatuses);

export const ticketTitleSchema = z
  .string()
  .trim()
  .min(1, "请输入标题")
  .max(200, "标题太长了");

export const createTicketSchema = z.object({
  title: ticketTitleSchema,
  description: z.string().max(20000, "简介太长了").optional(),
  color: stickyColorSchema.optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateTicketSchema = z.object({
  title: ticketTitleSchema.optional(),
  description: z.string().max(20000, "简介太长了").optional(),
  color: stickyColorSchema.optional(),
  status: ticketStatusSchema.optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});
