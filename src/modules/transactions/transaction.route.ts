import { Router } from "express";
import { getAllTransactions, getTransactionById, createTransaction, updateTransaction, deleteTransaction } from "./transaction.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createTransactionSchema, updateTransactionSchema } from "./transaction.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("read", "transactions"), getAllTransactions
    // #swagger.tags = ['Transactions']
    // #swagger.summary = 'Get all transactions with optional filters (?type=income, ?category=salary, ?startDate=, ?endDate=, ?page=1, ?limit=10)'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.get("/:id", authorize("read", "transactions"), getTransactionById
    // #swagger.tags = ['Transactions']
    // #swagger.summary = 'Get a single transaction by ID'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.post("/", authorize("create", "transactions"), validate(createTransactionSchema), createTransaction
    // #swagger.tags = ['Transactions']
    // #swagger.summary = 'Create a new transaction'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.patch("/:id", authorize("update", "transactions"), validate(updateTransactionSchema), updateTransaction
    // #swagger.tags = ['Transactions']
    // #swagger.summary = 'Update an existing transaction'
    // #swagger.security = [{ "bearerAuth": [] }]
);

router.delete("/:id", authorize("delete", "transactions"), deleteTransaction
    // #swagger.tags = ['Transactions']
    // #swagger.summary = 'Soft delete a transaction'
    // #swagger.security = [{ "bearerAuth": [] }]
);

export default router;
