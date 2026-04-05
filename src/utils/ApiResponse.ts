import { type Response } from "express";

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T | undefined;
    errors?: Record<string, string>[] | undefined;
    meta?: PaginationMeta | undefined;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const sendSuccess = <T>(
    res: Response,
    statusCode: number = 200,
    message: string,
    data?: T,
    meta?: PaginationMeta
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
        meta,
    };
    return res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    message: string,
    statusCode: number = 400,
    errors?: Record<string, string>[]
): Response => {
    const response: ApiResponse = {
        success: false,
        message,
        errors,
    };
    return res.status(statusCode).json(response);
};