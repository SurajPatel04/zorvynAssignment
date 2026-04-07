import express, { type Application } from "express";
import type { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { createRequire } from "module";
import cors from "cors";
import { env } from "./config/env.js";

const require = createRequire(import.meta.url);
const swaggerOutput = require("./config/swagger-output.json");

import authRouter from "./modules/auth/auth.routes.js";
import userRouter from "./modules/users/user.route.js";
import permissionRouter from "./modules/permissions/permission.route.js";
import roleRouter from "./modules/roles/role.route.js";
import transactionRouter from "./modules/transactions/transaction.route.js";
import dashboardRouter from "./modules/dashboard/dashboard.route.js";

const app: Application = express();

// middleware
app.use(express.json({ limit: "12kb" }));
app.use(cookieParser());

// swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerOutput));
const allowedOrigins =
    env.nodeEnv === "production"
        ? ["https://zorvynassignment-swwh.onrender.com"]
        : ["http://localhost:3000", "http://localhost:5173"];
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,         // required for HttpOnly cookies to work cross-origin
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);


// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/permissions", permissionRouter);
app.use("/api/v1/roles", roleRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// base route to serve swagger
app.get("/", (req: Request, res: Response) => {
    res.redirect("/api-docs");
});

app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// GLOBAL ERROR HANDLER
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("ERROR:", err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

export default app;