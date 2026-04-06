import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../modules/users/user.model.js";
import type { IUser } from "../modules/users/user.model.js";
import type { IRole } from "../modules/users/role.models.js";
import type { IPermission } from "../modules/permissions/permission.model.js";
import "../modules/permissions/permission.model.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

interface JwtPayload {
    _id: string;
    email: string;
    username: string;
    fullName: string;
}



export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            throw new ApiError(401, "Access token is missing. Please login.");
        }

        const decoded = jwt.verify(token, env.accessToken.secret) as JwtPayload;

        const user = await User.findById(decoded._id)
            .select("-password")
            .populate({
                path: "roleId",
                populate: {
                    path: "permissions",
                    select: "action resource",
                },
            });

        if (!user) {
            throw new ApiError(401, "Invalid token. User no longer exists.");
        }

        if (!user.isActive) {
            throw new ApiError(403, "Account has been deactivated.");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(new ApiError(401, "Invalid or expired access token."));
    }
};

export const authorize = (action: string, resource: string) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.user;

        if (!user) {
            return next(new ApiError(401, "Authentication required."));
        }

        const role = user.roleId as unknown as IRole;

        if (!role) {
            return next(new ApiError(403, "Access denied. No role assigned."));
        }

        const permissions = role.permissions as unknown as IPermission[];
        const hasPermission = permissions.some(
            (perm) => perm.action === action && perm.resource === resource
        );

        if (!hasPermission) {
            return next(
                new ApiError(403, `Access denied. Role '${role.name}' does not have sufficient permissions.`)
            );
        }

        next();
    };
};

export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.user;

        if (!user) {
            return next(new ApiError(401, "Authentication required."));
        }

        const role = user.roleId as unknown as IRole;

        if (!role) {
            return next(new ApiError(403, "Access denied. No role assigned."));
        }

        const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

        const hasRole = normalizedAllowed.includes(role.name.toLowerCase());

        if (!hasRole) {
            return next(
                new ApiError(403, `Access denied. Only allowed roles: ${allowedRoles.join(", ")}`)
            );
        }

        next();
    };
};

export const authorizeSelfOr = (action: string, resource: string) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.user;
        const targetId = req.params.id;

        if (!user) {
            return next(new ApiError(401, "Authentication required."));
        }

        if (user._id.toString() === targetId) {
            return next();
        }

        const role = user.roleId as unknown as IRole;

        if (!role) {
            return next(new ApiError(403, "Access denied. No role assigned."));
        }

        const permissions = role.permissions as unknown as IPermission[];
        const hasPermission = permissions.some(
            (perm) => perm.action === action && perm.resource === resource
        );

        if (!hasPermission) {
            return next(
                new ApiError(403, `Access denied. Role '${role.name}' does not have sufficient permissions, or you are not operating on your own account.`)
            );
        }

        next();
    };
};
