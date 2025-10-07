import mongoose from "mongoose";
import { logger } from "./logger";

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10
  } as any);

  mongoose.connection.on("connected", () => logger.info("Mongo connected"));
  mongoose.connection.on("error", (err) => logger.error("Mongo error", { err }));
  mongoose.connection.on("disconnected", () => logger.warn("Mongo disconnected"));
};
