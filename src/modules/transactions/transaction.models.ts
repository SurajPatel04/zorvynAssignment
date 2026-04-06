// transaction.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { User } from "../users/user.model.js";

export interface ITransaction extends Document {
    amount: number;
    type: "income" | "expense";
    category: string;
    date: Date;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
}

const transactionSchema = new Schema<ITransaction>(
    {
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ["income", "expense"],
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        notes: {
            type: String,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: User,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: User,
            required: false,
        },
    },
    { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);