import type { Request, Response } from "express";
import Permission from "./permission.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import mongoose from "mongoose";
import type { CreatePermissionBody } from "./permission.validator.js";

export const getAllPermissions = asyncHandler(async (req: Request, res: Response) => {
    const { action, resource, page, limit } = req.query;

    const filter: Record<string, any> = {};
    if (action) filter.action = action as string;
    if (resource) filter.resource = resource as string;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [permissions, total] = await Promise.all([
        Permission.find(filter)
            .sort({ resource: 1, action: 1 })
            .skip(skip)
            .limit(limitNum),
        Permission.countDocuments(filter),
    ]);

    if (Object.keys(filter).length > 0 && permissions.length === 0) {
        throw new ApiError(404, "No permissions found matching the criteria");
    }

    return sendSuccess(res, 200, "Permissions fetched successfully", { permissions }, {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
    });
});

export const getPermissionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        throw new ApiError(400, "Invalid permission ID format");
    }

    const permission = await Permission.findById(id);

    if (!permission) {
        throw new ApiError(404, "Permission not found");
    }

    return sendSuccess(res, 200, "Permission fetched successfully", { permission });
});

export const createPermission = asyncHandler(async (req: Request, res: Response) => {
    const { action, resource, description } = req.body as CreatePermissionBody;

    const existingParam = await Permission.findOne({ action, resource });
    if (existingParam) {
        throw new ApiError(409, `Permission ${action}:${resource} already exists`);
    }

    const permission = await Permission.create({ action, resource, ...(description ? { description } : {}) });

    return sendSuccess(res, 201, "Permission created successfully", { permission });
});

export const deletePermission = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        throw new ApiError(400, "Invalid permission ID format");
    }

    const permission = await Permission.findByIdAndDelete(id);

    if (!permission) {
        throw new ApiError(404, "Permission not found");
    }

    return sendSuccess(res, 200, "Permission deleted successfully");
});
