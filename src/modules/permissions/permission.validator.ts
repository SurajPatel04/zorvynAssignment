import { z } from "zod";

export const createPermissionSchema = z.object({
    action: z.enum(["create", "read", "update", "delete"]),
    resource: z.string().min(1, "Resource is required").trim().toLowerCase(),
    description: z.string().optional()
});



export type CreatePermissionBody = z.infer<typeof createPermissionSchema>;

