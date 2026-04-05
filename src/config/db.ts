import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async (): Promise<void> => {
    try {
        const connectionInstance = await mongoose.connect(env.mongoUri)

        console.log(`DB connected: ${connectionInstance.connection.host}`)
    } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("DB Connection error:", error.message);
    } else {
      console.error("DB Connection error:", error);
    }
    process.exit(1);
  }
}

export default connectDB;