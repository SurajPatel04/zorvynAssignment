import { env } from "./config/env.js"
import connectDB from "./config/db.js"
import express from "express"


const app = express()
const PORT = env.port

app.get("/", (req, res) => {
    res.send("Welcome")
})


connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    })
    .catch((error: unknown) => {
        if (error instanceof Error) {
            console.error("DB Connection error:", error.message);
        } else {
            console.error("DB Connection error:", error);
        }
        process.exit(1);
    })