import { z } from "zod";

export const createRoleSchema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional()
});

export const updateRoleSchema = z.object({
    name: z.string().trim().optional(),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional()
});

export type CreateRoleBody = z.infer<typeof createRoleSchema>;
export type UpdateRoleBody = z.infer<typeof updateRoleSchema>;
