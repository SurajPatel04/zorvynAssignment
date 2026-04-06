import { z } from "zod";

export const createTransactionSchema = z.object({
    amount: z.number().positive("Amount must be a positive number"),
    type: z.enum(["income", "expense"]),
    category: z.string().min(1, "Category is required").trim(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    notes: z.string().optional(),
});

export const updateTransactionSchema = z.object({
    amount: z.number().positive("Amount must be a positive number").optional(),
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().min(1, "Category is required").trim().optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }).optional(),
    notes: z.string().optional(),
});

export type CreateTransactionBody = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionBody = z.infer<typeof updateTransactionSchema>;
