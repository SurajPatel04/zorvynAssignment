import mongoose from "mongoose";

import { Role } from "../modules/roles/role.model.js";
import { User } from "../modules/users/user.model.js";
import { Transaction } from "../modules/transactions/transaction.models.js";
import { ROLES } from "../utils/constant.js";
import connectDB from "../config/db.js";

const DEV_PASSWORD = "Test@1234";

const devUsers = [
    { fullName: "Rahul Viewer", username: "rahul", email: "rahul@test.com", role: ROLES.VIEWER },
    { fullName: "Priya Analyst", username: "priya", email: "priya@test.com", role: ROLES.ANALYST },
    { fullName: "Suraj Admin", username: "suraj", email: "suraj@test.com", role: ROLES.ADMIN },
];

const categories = {
    income: ["salary", "freelance", "investment", "bonus", "rental"],
    expense: ["food", "rent", "utilities", "transport", "entertainment", "healthcare", "shopping"],
};

const noteTemplates = {
    income: ["Monthly salary", "Freelance project payment", "Stock dividends", "Performance bonus", "Rental income"],
    expense: ["Grocery shopping", "Monthly rent", "Electricity bill", "Uber ride", "Netflix subscription", "Doctor visit", "Amazon order"],
};

const randomDate = () => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    return new Date(
        sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
    );
};

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

const randomAmount = (type: "income" | "expense") => {
    return type === "income"
        ? Math.floor(Math.random() * 90000 + 10000)
        : Math.floor(Math.random() * 9000 + 500);
};

const generateTransactions = (createdById: mongoose.Types.ObjectId, count: number) => {
    return Array.from({ length: count }, () => {
        const type = randomItem(["income", "expense"] as const);
        return {
            amount: randomAmount(type),
            type,
            category: randomItem(categories[type]),
            date: randomDate(),
            notes: randomItem(noteTemplates[type]),
            createdBy: createdById,
            isDeleted: false,
        };
    });
};

const seedDev = async () => {
    try {
        console.log("Connecting to database...");
        await connectDB();

        // Create dev users
        console.log("Creating dev users...");
        const createdUsers: any[] = [];

        for (const devUser of devUsers) {
            const existing = await User.findOne({ email: devUser.email });
            if (existing) {
                console.log(`  User "${devUser.username}" already exists, skipping.`);
                createdUsers.push(existing);
                continue;
            }

            const role = await Role.findOne({ name: devUser.role });
            if (!role) {
                console.error(`  Role "${devUser.role}" not found. Run 'npm run seed' first.`);
                process.exit(1);
            }

            const user = await User.create({
                fullName: devUser.fullName,
                username: devUser.username,
                email: devUser.email,
                password: DEV_PASSWORD,
                roleId: role._id,
                isActive: true,
            });

            console.log(`  User "${devUser.username}" created (${devUser.role}).`);
            createdUsers.push(user);
        }

        // Seed transactions (created by the admin user)
        const adminUser = createdUsers.find(
            (u) => u.email === "suraj@test.com"
        );

        if (!adminUser) {
            console.error("  Admin user not found. Cannot seed transactions.");
            process.exit(1);
        }

        const existingCount = await Transaction.countDocuments();
        if (existingCount > 0) {
            console.log(`  ${existingCount} transactions already exist, skipping transaction seeding.`);
        } else {
            console.log("Seeding fake transactions...");
            const transactions = generateTransactions(adminUser._id as mongoose.Types.ObjectId, 150);
            await Transaction.insertMany(transactions);
            console.log("  150 transactions seeded across last 6 months.");
        }

        console.log("\nDev seed completed successfully!");
        console.log("\nTest Credentials:");
        console.log("  rahul@test.com / Test@1234  → Viewer");
        console.log("  priya@test.com / Test@1234  → Analyst");
        console.log("  suraj@test.com / Test@1234  → Admin");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding dev data:", error);
        process.exit(1);
    }
};

seedDev();
