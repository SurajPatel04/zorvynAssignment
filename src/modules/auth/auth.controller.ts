import jwt from "jsonwebtoken"
import { User } from "../users/user.model.js"
import { Role } from "../roles/role.models.js"
import bcrypt from "bcrypt"
import type { Request, Response } from "express"
import type { RegisterBody, LoginBody } from "./auth.validator.js"
import { z } from "zod"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { ApiError } from "../../utils/apiError.js"
import { DEFAULT_ROLE } from "../../utils/constant.js"
import { sendSuccess } from "../../utils/apiResponse.js"
import { generateAuthTokens } from "./auth.service.js"
import { RefreshToken } from "./refreshToken.model.js"
import { hashToken } from "../../utils/hash.js"
import { env } from "../../config/env.js"
import ms, { type StringValue } from "ms"

export const registerUser = asyncHandler(
    async (req: Request<{}, {}, RegisterBody>, res: Response) => {
        const { fullName, username, email, password } = req.body;

        if (!fullName || !username || !email || !password) {
            throw new ApiError(400, "All fields are required")
        }
        const normalizedEmail = email.toLowerCase().trim()
        const normalizedUsername = username.toLowerCase().trim()

        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
        })


        if (existingUser) {
            if (existingUser.email === email) {
                throw new ApiError(409, "Email is already registered");
            }
            if (existingUser.username === username) {
                throw new ApiError(409, "Username is already taken");
            }
        }

        const defaultRole = await Role.findOne({ name: DEFAULT_ROLE })

        if (!defaultRole) {
            throw new ApiError(404, `Role '${DEFAULT_ROLE}' does not exist. Please run seeds first.`);
        }

        const user = await User.create({
            fullName: fullName,
            username: normalizedUsername,
            email: normalizedEmail,
            password: password,
            roleId: defaultRole._id
        })
        const createdUser = await User.findById(user._id)
            .select("-password")
            .populate({
                path: "roleId",
                select: "name description",
            });


        if (!createdUser) {
            throw new ApiError(500, "User creation failed")
        }

        return sendSuccess(
            res,
            201,
            "User registered successfully",
            { user: createdUser }
        )
    }
)

export const loginUser = asyncHandler(
    async (req: Request<{}, {}, LoginBody>, res: Response) => {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new ApiError(400, "Email and Password is required.");
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail }).select("+password");

        if (!user) {
            throw new ApiError(404, "User not found. Please create an account first.");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials.");
        }

        const { accessToken, refreshToken } = await generateAuthTokens(user, req);

        const loggedInUser = await User.findById(user._id)
            .select("-password")
            .populate({
                path: "roleId",
                select: "name description",
            });


        const cookieOptions = {
            httpOnly: true,
            secure: env.nodeEnv === "production",
            sameSite: "strict" as const,
        };

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: ms(env.accessToken.expiresIn as StringValue),
        });
        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            path: "/api/v1/auth",
            maxAge: ms(env.refreshToken.expiresIn as StringValue),
        });

        return sendSuccess(
            res,
            200,
            "Login successful",
            { user: loggedInUser, accessToken, refreshToken }
        );
    }
)

export const logoutUser = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const rawToken = req.cookies?.refreshToken;

        if (!rawToken) {
            throw new ApiError(400, "Refresh token is required.");
        }

        const hashedToken = hashToken(rawToken);

        const result = await RefreshToken.updateOne(
            { token: hashedToken, userId, isRevoked: false },
            { $set: { isRevoked: true } }
        );

        if (result.matchedCount === 0) {
            throw new ApiError(400, "Invalid request.");
        }

        const cookieOptions = {
            httpOnly: true,
            secure: env.nodeEnv === "production",
            sameSite: "strict" as const,
        };

        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", {
            ...cookieOptions,
            path: "/api/v1/auth",
        });

        return sendSuccess(res, 200, "Logged out successfully");
    }
)

export const logoutUserFromAllDevices = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const result = await RefreshToken.updateMany(
            { userId, isRevoked: false },
            { $set: { isRevoked: true } }
        );

        const cookieOptions = {
            httpOnly: true,
            secure: env.nodeEnv === "production",
            sameSite: "strict" as const,
        };

        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", {
            ...cookieOptions,
            path: "/api/v1/auth",
        });

        return sendSuccess(res, 200, `Logged out from all devices. ${result.modifiedCount} session(s) revoked.`);
    }
)

export const refreshAccessToken = asyncHandler(
    async (req: Request, res: Response) => {
        const rawToken = req.cookies?.refreshToken;

        if (!rawToken) {
            throw new ApiError(400, "Refresh token is required.");
        }

        const hashedToken = hashToken(rawToken);

        const existingToken = await RefreshToken.findOne({
            token: hashedToken,
            isRevoked: false,
            expireAt: { $gt: new Date() },
        });

        if (!existingToken) {
            throw new ApiError(401, "Invalid or expired refresh token.");
        }

        await RefreshToken.updateOne(
            { _id: existingToken._id },
            { $set: { isRevoked: true } }
        );

        const user = await User.findById(existingToken.userId).select("-password");

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        if (!user.isActive) {
            throw new ApiError(403, "User account is disabled.");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAuthTokens(user, req);

        const cookieOptions = {
            httpOnly: true,
            secure: env.nodeEnv === "production",
            sameSite: "strict" as const,
        };

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: ms(env.accessToken.expiresIn as StringValue),
        });
        res.cookie("refreshToken", newRefreshToken, {
            ...cookieOptions,
            path: "/api/v1/auth",
            maxAge: ms(env.refreshToken.expiresIn as StringValue),
        });

        return sendSuccess(
            res,
            200,
            "Access token refreshed successfully",
            { accessToken, refreshToken: newRefreshToken }
        );
    }
)