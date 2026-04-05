import { z } from "zod";

export const registerSchema = z.object({
    fullName: z
        .string({ message: "Full name is required" })
        .min(3, "Full name must be at least 3 characters")
        .max(50, "Full name must be under 50 characters")
        .trim(),

    email: z
        .string({ message: "Email is required" })
        .email("Invalid email address")
        .toLowerCase()
        .trim(),

    username: z
        .string({ message: "Username is required" })
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be under 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .trim(),

    password: z
        .string({ message: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(64, "Password too long"),
});

export const loginSchema = z.object({
    email: z
        .string({ message: "Email is required" })
        .email("Invalid email address")
        .toLowerCase()
        .trim(),

    password: z
        .string({ message: "Password is required" })
})

export type LoginBody = z.infer<typeof loginSchema>;
export type RegisterBody = z.infer<typeof registerSchema>;