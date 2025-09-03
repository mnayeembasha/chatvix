import mongoose from "mongoose";
import {MONGO_URL} from "../config";

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URL!);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); //1 means failure
    }
}