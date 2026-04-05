import mongoose, { Schema, Model, Document } from "mongoose";
import bcrypt from "bcrypt";
import { Role } from "./role.models.js";

export interface IUser extends Document {
    fullName: string;
    username: string;
    email: string;
    password: string;
    roles: mongoose.Types.ObjectId[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    isPasswordCorrect(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    roles: [
        {
            type: Schema.Types.ObjectId,
            ref: Role,
            index: true,
            required: true,
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const SALT_ROUNDS = 10;

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return;
    };
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
})

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password)
}

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);