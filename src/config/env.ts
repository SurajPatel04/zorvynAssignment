import dotenv from "dotenv";
import ms, { type StringValue } from "ms"
dotenv.config();

const requiredEnv = [
  "MONGO_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET"
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 8000,

  mongoUri: process.env.MONGO_URI as string,

  nodeEnv: process.env.NODE_ENV || "development",

  accessToken: {
    secret: process.env.ACCESS_TOKEN_SECRET as string,
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "30m",
  },

  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET as string,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
  },

  seed: {
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
  },

  rateLimit: {
    max: Number(process.env.RATE_LIMIT_MAX) || 10,
    windowMs: ms((process.env.RATE_LIMIT_WINDOW || "15m") as StringValue)
  }
} as const;