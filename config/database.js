import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("📊 Using existing MongoDB connection");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "minigpt_rag",
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected successfully`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("📊 MongoDB disconnected");
  isConnected = false;
});

mongoose.connection.on("error", (err) => {
  console.error(`📊 MongoDB error: ${err}`);
});
