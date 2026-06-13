// Standalone seed script: `npm run seed`
// Only useful with a PERSISTENT database (Atlas or local MongoDB).
// With USE_MEMORY_DB=true the server auto-seeds itself on startup instead.
import "dotenv/config";
import { connectDB, disconnectDB } from "./config/db.js";
import { seedDatabase } from "./seedData.js";

async function run() {
  await connectDB();
  console.log("Seeding database...");
  await seedDatabase();
  console.log("\n✅ Seed complete!");
  await disconnectDB();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
