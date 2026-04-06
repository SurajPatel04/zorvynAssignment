import type { Request, Response } from "express";
import { User } from "./user.model.js";
import { Role } from "../roles/role.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import type { UpdateUserBody, UpdateStatusBody } from "./user.validator.js";

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "Authentication required.");
    }
    return sendSuccess(res, 200, "User profile fetched successfully", { user });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, isActive } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    
    // Status Filter
    if (isActive === "false") {
        filter.isActive = false;
    } else if (isActive === "all") {
        // No filter on isActive, show everyone
    } else {
        filter.isActive = true; // Default: Only active users
    }

    if (search) {
        const regex = new RegExp(search as string, "i");
        filter.$or = [
            { fullName: regex },
            { email: regex },
            { username: regex }
        ];
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .select("-password")
            .populate({ path: "roleId", select: "name description" })
            .skip(skip)
            .limit(limitNum),
        User.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, "Users fetched successfully", { users }, {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
    });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id)
        .select("-password")
        .populate({ path: "roleId", select: "name description" });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return sendSuccess(res, 200, "User fetched successfully", { user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fullName, roleId } = req.body as UpdateUserBody;

    const user = await User.findById(id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (fullName) {
        user.fullName = fullName;
    }

    if (roleId) {
        const validRole = await Role.findById(roleId);
        if (!validRole) {
            throw new ApiError(400, "Role ID is invalid");
        }
        user.roleId = validRole._id as any;
    }

    await user.save();

    const updatedUser = await User.findById(id)
        .select("-password")
        .populate({ path: "roleId", select: "name description" });

    return sendSuccess(res, 200, "User updated successfully", { user: updatedUser });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = req.user!;

    if (requestingUser._id.toString() === id) {
        throw new ApiError(403, "Admin cannot delete their own account to prevent lockout.");
    }

    const user = await User.findById(id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.isActive = false;
    await user.save();

    return sendSuccess(res, 200, "User soft-deleted successfully");
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = req.user!;

    // Prevent admin from deactivating themselves
    const role = requestingUser.roleId as any;
    const isAdmin = role?.name?.toLowerCase() === "admin";

    if (isAdmin && requestingUser._id.toString() === id) {
        throw new ApiError(403, "Admin cannot deactivate their own account to prevent lockout.");
    }

    const user = await User.findById(id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isActive === false) {
        return sendSuccess(res, 200, "User is already deactivated");
    }

    user.isActive = false;
    await user.save();

    return sendSuccess(res, 200, "User deactivated successfully");
});


export const reactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isActive) {
        return sendSuccess(res, 200, "User is already active");
    }

    user.isActive = true;
    await user.save();

    return sendSuccess(res, 200, "User reactivated successfully");
});
