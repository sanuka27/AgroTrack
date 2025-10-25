import mongoose from "mongoose";
import { logger } from "./logger";
import { installCollectionGuard } from "../utils/collection-guard";

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  // Global Mongoose hardening
  mongoose.set('strictQuery', true);
  // Prevent implicit collection/index creation
  mongoose.set('autoCreate', false);
  mongoose.set('autoIndex', false);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10
  } as any);

  // Install collection guard after connection
  const db = mongoose.connection.db;
  if (db) {
    installCollectionGuard(db);
  }

  mongoose.connection.on("connected", () => logger.info("Mongo connected"));
  mongoose.connection.on("error", (err) => logger.error("Mongo error", { err }));
  mongoose.connection.on("disconnected", () => logger.warn("Mongo disconnected"));
};
