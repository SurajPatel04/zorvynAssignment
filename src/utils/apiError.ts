export class ApiError extends Error {
    public statusCode: number;
    public success: boolean;
    public errors: Record<string, string>[];
    public isOperational: boolean;

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: Record<string, string>[] = [],
    ) {
        super(message);

        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}