import type { Request, Response } from "express";
import { Role } from "./role.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import mongoose from "mongoose";
import type { CreateRoleBody, UpdateRoleBody } from "./role.validator.js";
import { ROLES } from "../../utils/constant.js";

export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [roles, total] = await Promise.all([
        Role.find()
            .populate("permissions")
            .skip(skip)
            .limit(limitNum),
        Role.countDocuments(),
    ]);

    return sendSuccess(res, 200, "Roles fetched successfully", { roles }, {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
    });
});

export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        throw new ApiError(400, "Invalid role ID format");
    }

    const role = await Role.findById(id).populate("permissions");

    if (!role) {
        throw new ApiError(404, "Role not found");
    }

    return sendSuccess(res, 200, "Role fetched successfully", { role });
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, permissions } = req.body as CreateRoleBody;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
        throw new ApiError(409, `Role with name '${name}' already exists`);
    }

    const rolePayload: any = {
        name,
        permissions: permissions || []
    };

    if (description !== undefined) {
        rolePayload.description = description;
    }

    const role = await Role.create(rolePayload);

    const populatedRole = await Role.findById(role._id).populate("permissions");

    return sendSuccess(res, 201, "Role created successfully", { role: populatedRole });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, permissions } = req.body as UpdateRoleBody;

    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        throw new ApiError(400, "Invalid role ID format");
    }

    const role = await Role.findById(id);

    if (!role) {
        throw new ApiError(404, "Role not found");
    }

    // Prevent renaming core systems roles to avoid breaking auth
    const coreRoles = [ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER];
    if (name && name !== role.name && coreRoles.includes(role.name as any)) {
        throw new ApiError(403, `Cannot rename core system role '${role.name}'`);
    }

    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions as any;

    await role.save();

    const populatedRole = await Role.findById(id).populate("permissions");

    return sendSuccess(res, 200, "Role updated successfully", { role: populatedRole });
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        throw new ApiError(400, "Invalid role ID format");
    }

    const role = await Role.findById(id);

    if (!role) {
        throw new ApiError(404, "Role not found");
    }

    const coreRoles = [ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER];
    if (coreRoles.includes(role.name as any)) {
        throw new ApiError(403, `Cannot delete core system role '${role.name}'`);
    }

    await Role.findByIdAndDelete(id);

    return sendSuccess(res, 200, "Role deleted successfully");
});
