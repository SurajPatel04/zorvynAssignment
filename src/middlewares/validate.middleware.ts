import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema, ZodError } from "zod";
import { ApiError } from "../utils/apiError.js";

export const validate = <T>(schema: ZodSchema<T>): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.issues.reduce<Record<string, string>>(
                (acc, issue) => {
                    const field = issue.path.join(".");
                    acc[field] = issue.message;
                    return acc;
                },
                {}
            );

            return next(
                new ApiError(422, "Validation failed", [errors])
            );
        }

        req.body = result.data;
        next();
    };
};