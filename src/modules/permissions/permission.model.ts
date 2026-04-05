import mongoose, { Schema, Model, Document } from "mongoose";

export interface IPermission extends Document {
    action: string;
    resource: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
    {
        action: {
            type: String,
            required: true,
            enum: ["create", "read", "update", "delete"],
        },
        resource: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

permissionSchema.index({ action: 1, resource: 1 }, { unique: true });

const Permission: Model<IPermission> = mongoose.model<IPermission>(
    "Permission",
    permissionSchema
);

export default Permission;