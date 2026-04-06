import jwt, { type SignOptions } from "jsonwebtoken"
import { type Request } from "express";
import { RefreshToken } from "./refreshToken.model.js"
import ms, { type StringValue } from "ms";
import { env } from "../../config/env.js";
import { Types } from "mongoose"

interface ITokenUser {
    _id: Types.ObjectId | string;
    email: string;
    username: string;
    fullName: string;
    roleId?: Types.ObjectId | string
}

interface IRefreshToken {
    token: string;
    userId: Types.ObjectId;
    deviceInfo?: string;
    ipAddress?: string;
    expireAt: Date;
}


export const generateAccessToken = (user: ITokenUser): string => {
    const secret = env.accessToken.secret
    const expiresIn = env.accessToken.expiresIn || "15m"

    if (!secret) {
        throw new Error("Access token secret is missing");
    }

    const payload = {
        _id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName
    }

    const options: SignOptions = {
        expiresIn: expiresIn as StringValue,
    };

    return jwt.sign(payload, secret, options);

}

export const generateRefreshToken = (user: Pick<ITokenUser, "_id">): string => {
    const secret = env.refreshToken.secret
    const expiresIn = env.refreshToken.expiresIn || "10d"

    if (!secret) {
        throw new Error("Refresh token secret is missing");
    }

    const payload = {
        _id: user._id
    }

    const options: SignOptions = {
        expiresIn: expiresIn as StringValue
    }

    return jwt.sign(payload, secret, options)
}


export const generateAndRefreshToken = async (user: Pick<ITokenUser, "_id">, req: Request): Promise<string> => {
    const refreshToken = generateRefreshToken(user);
    const expireAt = new Date(
        Date.now() + ms(env.refreshToken.expiresIn as StringValue)
    );


    // Revoke existing refresh tokens only for the same device
    const deviceInfo = req.headers["user-agent"] || null;
    await RefreshToken.updateMany(
        { userId: user._id, deviceInfo, isRevoked: false },
        { $set: { isRevoked: true } }
    );

    await RefreshToken.create({
        token: refreshToken,
        userId: user._id,
        expireAt: expireAt,
        ...(req.headers["user-agent"] && { deviceInfo: req.headers["user-agent"] }),
        ...(req.ip && { ipAddress: req.ip }),
    });

    return refreshToken;
}



export const generateAuthTokens = async (
    user: ITokenUser,
    req: Request
): Promise<{ accessToken: string; refreshToken: string }> => {
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateAndRefreshToken(user, req);

    return { accessToken, refreshToken };
};