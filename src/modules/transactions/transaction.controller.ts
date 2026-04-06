import type { Request, Response } from "express";
import { Transaction } from "./transaction.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import mongoose from "mongoose";
import type { CreateTransactionBody, UpdateTransactionBody } from "./transaction.validator.js";

export const getAllTransactions = asyncHandler(async (req: Request, res: Response) => {
    const { type, category, startDate, endDate, page, limit, search } = req.query;

    const filter: any = { isDeleted: false };

    if (search) {
        const regex = new RegExp(search as string, "i");
        filter.$or = [
            { category: regex },
            { notes: regex }
        ];
    }

    if (type) filter.type = type as string;
    if (category) filter.category = category as string;
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
        Transaction.find(filter)
            .populate("createdBy", "fullName email")
            .populate("updatedBy", "fullName email")
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum),
        Transaction.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, "Transactions fetched successfully", { transactions }, {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
    });
});

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        throw new ApiError(400, "Invalid transaction ID format");
    }

    const transaction = await Transaction.findOne({ _id: id, isDeleted: false })
        .populate("createdBy", "fullName email")
        .populate("updatedBy", "fullName email");

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    return sendSuccess(res, 200, "Transaction fetched successfully", { transaction });
});

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { amount, type, category, date, notes } = req.body as CreateTransactionBody;
    const requestingUser = req.user!;

    const payload: any = {
        amount,
        type,
        category,
        date: new Date(date),
        createdBy: requestingUser._id,
    };

    if (notes !== undefined) {
        payload.notes = notes;
    }

    const transaction = await Transaction.create(payload);

    const populated = await Transaction.findById(transaction._id)
        .populate("createdBy", "fullName email");

    return sendSuccess(res, 201, "Transaction created successfully", { transaction: populated });
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, type, category, date, notes } = req.body as UpdateTransactionBody;
    const requestingUser = req.user!;

    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        throw new ApiError(400, "Invalid transaction ID format");
    }

    const transaction = await Transaction.findOne({ _id: id, isDeleted: false });

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    if (amount !== undefined) transaction.amount = amount;
    if (type !== undefined) transaction.type = type;
    if (category !== undefined) transaction.category = category;
    if (date !== undefined) transaction.date = new Date(date);
    if (notes !== undefined) transaction.notes = notes;
    transaction.updatedBy = requestingUser._id as mongoose.Types.ObjectId;

    await transaction.save();

    const populated = await Transaction.findById(id)
        .populate("createdBy", "fullName email")
        .populate("updatedBy", "fullName email");

    return sendSuccess(res, 200, "Transaction updated successfully", { transaction: populated });
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
        throw new ApiError(400, "Invalid transaction ID format");
    }

    const transaction = await Transaction.findOne({ _id: id, isDeleted: false });

    if (!transaction) {
        throw new ApiError(404, "Transaction not found");
    }

    transaction.isDeleted = true;
    transaction.updatedBy = req.user!._id as mongoose.Types.ObjectId;
    await transaction.save();

    return sendSuccess(res, 200, "Transaction soft-deleted successfully");
});
