import mongoose, { Schema, Model, Document } from "mongoose";
import { User } from "../users/user.model.js"
import { hashToken } from "../../utils/hash.js"

export interface IRefreshToken extends Document {
    token: string,
    userId: mongoose.Types.ObjectId;
    deviceInfo: string;
    ipAddress: string;
    expireAt: Date;
    isRevoked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
    token: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: User,
        index: true,
        required: true,
    },
    deviceInfo: {
        type: String,
        default: null,
    },
    ipAddress: {
        type: String,
        default: null
    },
    expireAt: {
        type: Date,
        required: true
    },
    isRevoked: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });


refreshTokenSchema.pre("save", async function (next) {
    if (!this.isModified("token")) {
        return;
    }
    this.token = hashToken(this.token);
})

export const RefreshToken: Model<IRefreshToken> = mongoose.model<IRefreshToken>("RefreshToken", refreshTokenSchema);
