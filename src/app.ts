import express, { type Application } from "express";
import type { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const swaggerOutput = require("./config/swagger-output.json");

import authRouter from "./modules/auth/auth.routes.js";
import userRouter from "./modules/users/user.routes.js";
import permissionRouter from "./modules/permissions/permission.routes.js";

const app: Application = express();

// middleware
app.use(express.json({ limit: "12kb" }));
app.use(cookieParser());

// swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerOutput));

// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/permissions", permissionRouter);

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