import { z } from "zod";

export const updateUserSchema = z.object({
    fullName: z
        .string()
        .min(3, "Full name must be at least 3 characters")
        .max(50, "Full name must be under 50 characters")
        .trim()
        .optional(),
    roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid role ID").optional()
});

export const updateStatusSchema = z.object({
    isActive: z.boolean({ message: "isActive flag must be a boolean" })
});

export type UpdateUserBody = z.infer<typeof updateUserSchema>;
export type UpdateStatusBody = z.infer<typeof updateStatusSchema>;
