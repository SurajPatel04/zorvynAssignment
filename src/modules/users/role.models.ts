// models/role.model.ts
import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IRole extends Document {
    name: string;
    description?: string;
    permissions: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        permissions: [
            {
                type: Schema.Types.ObjectId,
                ref: "Permission",
            },
        ],
    },
    { timestamps: true }
);

const Role: Model<IRole> = mongoose.model<IRole>("Role", roleSchema);

export default Role;