import { z } from "zod";

export const PricingDetailSchema = z.object({
  concept: z.string(),
  value: z.number(),
});

export const InstallmentSchema = z.object({
  index: z.number(),
  dueDate: z.string(),
  currency: z.string(),
  totalPrice: z.number(),
  totalNights: z.number(),
  details: z.array(PricingDetailSchema),
  breakdown: z.array(z.any()),
});

export const PricingResponseSchema = z.object({
  nights: z.number(),
  totalPrice: z.number(),
  currency: z.string(),
  appliedDiscounts: z.array(z.any()),
  details: z.array(PricingDetailSchema),
  installments: z.array(InstallmentSchema),
});

export type PricingResponse = z.infer<typeof PricingResponseSchema>;
