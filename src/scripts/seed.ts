import bcrypt from "bcrypt";
import mongoose from "mongoose";

import Permission from "../modules/permissions/permission.model.js";
import type { IPermission } from "../modules/permissions/permission.model.js";
import { Role } from "../modules/users/role.models.js";
import { User } from "../modules/users/user.model.js";
import { ROLES } from "../utils/constant.js";
import connectDB from "../config/db.js";
import { env } from "../config/env.js";

// Upsert a single permission
const upsertPermission = async (perm: { action: string; resource: string; description: string }) => {
    return Permission.findOneAndUpdate(
        { action: perm.action, resource: perm.resource },
        perm,
        { upsert: true, returnDocument: 'after' }
    );
};

// Upsert a single role
const upsertRole = async (role: { name: string; description: string; permissions: mongoose.Types.ObjectId[] }) => {
    return Role.findOneAndUpdate(
        { name: role.name },
        role,
        { upsert: true, returnDocument: 'after' }
    );
};

// Create a user only if they don't already exist
const createUserIfNotExists = async (userData: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    roleId: mongoose.Types.ObjectId;
    isActive: boolean;
}) => {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
        console.log(`  User "${userData.username}" already exists, skipping.`);
        return existing;
    }
    const user = await User.create(userData);
    console.log(`  User "${userData.username}" created.`);
    return user;
};

const seedDatabase = async () => {
    try {
        if (!env.seed.adminEmail || !env.seed.adminPassword) {
            throw new Error("Missing admin credentials in env (ADMIN_EMAIL / ADMIN_PASSWORD)");
        }

        console.log("Connecting to database...");
        await connectDB();

        // Upsert Permissions
        console.log("Upserting permissions...");
        const permissions = await Promise.all([
            // Transaction permissions
            upsertPermission({ action: "create", resource: "transactions", description: "Can create financial records" }),
            upsertPermission({ action: "read", resource: "transactions", description: "Can view financial records" }),
            upsertPermission({ action: "update", resource: "transactions", description: "Can modify financial records" }),
            upsertPermission({ action: "delete", resource: "transactions", description: "Can delete financial records" }),

            // User management permissions
            upsertPermission({ action: "read", resource: "users", description: "Can view users" }),
            upsertPermission({ action: "update", resource: "users", description: "Can manage user roles/status" }),
            upsertPermission({ action: "delete", resource: "users", description: "Can delete users" }),

            // Dashboard permissions
            upsertPermission({ action: "read", resource: "dashboard", description: "Can view dashboard summaries" }),
        ]);

        const getPermId = (action: string, resource: string) => {
            const perm = permissions.find((p: IPermission) => p.action === action && p.resource === resource);
            if (!perm) throw new Error(`Permission not found: ${action} ${resource}`);
            return perm._id;
        };

        // Upsert Roles (Viewer, Analyst, Admin)
        console.log("Upserting roles...");

        const viewerRole = await upsertRole({
            name: ROLES.VIEWER,
            description: "Can only view dashboard data and financial records",
            permissions: [
                getPermId("read", "dashboard"),
                getPermId("read", "transactions"),
            ],
        });

        const analystRole = await upsertRole({
            name: ROLES.ANALYST,
            description: "Can view records, users, and access dashboard insights",
            permissions: [
                getPermId("read", "transactions"),
                getPermId("read", "users"),
                getPermId("read", "dashboard"),
            ],
        });

        const adminRole = await upsertRole({
            name: ROLES.ADMIN,
            description: "Full system access — manage records, users, and dashboard",
            permissions: permissions.map((p: IPermission) => p._id),
        });

        // Create admin user (only if doesn't exist)
        console.log("Creating admin user...");

        await createUserIfNotExists({
            fullName: "System Admin",
            username: "admin",
            email: env.seed.adminEmail,
            password: env.seed.adminPassword,
            roleId: adminRole._id,
            isActive: true,
        });

        console.log("Database seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedDatabase();