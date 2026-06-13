import mongoose from "mongoose";

let memoryServer = null;

/**
 * Connects to MongoDB.
 * - If USE_MEMORY_DB=true (default when no real MONGO_URI), spins up an in-memory
 *   MongoDB so the app runs with zero setup. Data resets when the server restarts.
 * - Otherwise connects to MONGO_URI (Atlas or local MongoDB).
 */
export async function connectDB() {
  const useMemory = process.env.USE_MEMORY_DB === "true";

  try {
    let uri = process.env.MONGO_URI;

    if (useMemory) {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log("✓ In-memory MongoDB started (data resets on restart)");
    }

    await mongoose.connect(uri, { family: 4 });
    console.log(`✓ MongoDB connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("✗ MongoDB connection failed:", err.message);
    console.error("  Set USE_MEMORY_DB=true in server/.env for zero-setup, or provide a valid MONGO_URI.");
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
