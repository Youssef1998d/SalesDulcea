import { z } from "zod";

export const quoteSchema = z.object({
  company: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(30),
  email: z.union([z.literal(""), z.string().trim().email().max(160)]),
  city: z.string().trim().max(80).optional().default(""),
  items: z
    .array(z.object({ slug: z.string().max(80), name: z.string().max(160), quantity: z.string().trim().max(40) }))
    .min(1)
    .max(30),
  logo: z.boolean().default(false),
  message: z.string().trim().max(2000).optional().default(""),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

export type QuoteInput = z.infer<typeof quoteSchema>;
