import type { Request, Response } from "express";
import { Transaction } from "../transactions/transaction.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
    const [result] = await Transaction.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: null,
                totalIncome: {
                    $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
                },
                totalExpenses: {
                    $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
                },
                count: { $sum: 1 },
            },
        },
    ]);

    const summary = result || { totalIncome: 0, totalExpenses: 0, count: 0 };
    const netBalance = summary.totalIncome - summary.totalExpenses;

    return sendSuccess(res, 200, "Dashboard summary fetched successfully", {
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        netBalance,
        totalTransactions: summary.count,
    });
});

export const getCategoryTotals = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.query;

    const matchStage: any = { isDeleted: false };
    if (type) matchStage.type = type as string;

    const categories = await Transaction.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: { category: "$category", type: "$type" },
                total: { $sum: "$amount" },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                category: "$_id.category",
                type: "$_id.type",
                total: 1,
                count: 1,
            },
        },
        { $sort: { total: -1 } },
    ]);

    return sendSuccess(res, 200, "Category totals fetched successfully", { categories });
});

export const getTrends = asyncHandler(async (req: Request, res: Response) => {
    const { period } = req.query;

    const groupBy = period === "weekly"
        ? { year: { $isoWeekYear: "$date" }, week: { $isoWeek: "$date" } }
        : { year: { $year: "$date" }, month: { $month: "$date" } };

    const trends = await Transaction.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: groupBy,
                totalIncome: {
                    $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
                },
                totalExpenses: {
                    $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { "_id.year": -1, "_id.month": -1, "_id.week": -1 } },
    ]);

    const formatted = trends.map((t) => ({
        ...t._id,
        totalIncome: t.totalIncome,
        totalExpenses: t.totalExpenses,
        netBalance: t.totalIncome - t.totalExpenses,
        transactionCount: t.count,
    }));

    return sendSuccess(res, 200, "Trends fetched successfully", {
        period: period === "weekly" ? "weekly" : "monthly",
        trends: formatted,
    });
});

export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const transactions = await Transaction.find({ isDeleted: false })
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 })
        .limit(limit);

    return sendSuccess(res, 200, "Recent activity fetched successfully", { transactions });
});
