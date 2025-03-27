import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI.replace("<username>", process.env.DB_USER).replace("<password>", process.env.DB_PW).replace("<dbname>", process.env.DB_NAME));
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};