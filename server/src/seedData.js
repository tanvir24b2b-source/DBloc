// Reusable seed logic — called by the standalone seed script AND auto-seed on startup.
import User from "./models/User.js";
import Category from "./models/Category.js";
import Bloc from "./models/Bloc.js";
import Order from "./models/Order.js";
import Counter from "./models/Counter.js";
import SiteContent from "./models/SiteContent.js";
import { defaultContent } from "./data/defaultContent.js";

const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);

export async function seedDatabase({ force = false, log = console.log } = {}) {
  // --- Staff accounts ---
  // Passwords come from .env so real credentials are never committed to the repo.
  const masterPass = process.env.SEED_MASTER_PASSWORD || "master123";
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "admin123";
  await User.deleteMany({ role: { $in: ["master_admin", "admin", "subadmin", "moderator"] } });
  await User.create({ name: "Master Admin", email: "master@dblock.bd", password: masterPass, role: "master_admin" });
  await User.create({ name: "D Bloc Admin", email: "admin@dblock.bd", password: adminPass, role: "admin" });
  log("✓ Master admin seeded: master@dblock.bd");
  log("✓ Admin seeded: admin@dblock.bd");
  if (!process.env.SEED_MASTER_PASSWORD || !process.env.SEED_ADMIN_PASSWORD)
    log("⚠ Using DEFAULT seed passwords. Set SEED_MASTER_PASSWORD and SEED_ADMIN_PASSWORD in .env before production.");

  // --- Customer accounts ---
  // NOTE: use .save() (not insertMany) so the password-hashing pre-save hook runs.
  await User.deleteMany({ role: "user" });
  const customerSeeds = [
    { name: "Rahim Uddin",   email: "rahim@test.com",   mobile: "01711000001", address: "12 Mirpur, Dhaka",  password: "test1234", role: "user" },
    { name: "Karim Mia",     email: "karim@test.com",   mobile: "01711000002", address: "45 Gulshan, Dhaka", password: "test1234", role: "user" },
    { name: "Sumaiya Begum", email: "sumaiya@test.com", mobile: "01711000003", address: "7 Banani, Dhaka",   password: "test1234", role: "user" },
    { name: "Tanvir Ahmed",  email: "tanvir@test.com",  mobile: "01711000004", address: "33 Uttara, Dhaka",  password: "test1234", role: "user" },
    { name: "Nusrat Jahan",  email: "nusrat@test.com",  mobile: "01811000005", address: "Sylhet Sadar",      password: "test1234", role: "user" },
  ];
  const customers = [];
  for (const c of customerSeeds) {
    customers.push(await User.create(c));
  }
  log("✓ Seeded 5 customer accounts");

  // --- Categories ---
  const svgIcon = (emoji) =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='80' font-size='75' text-anchor='middle' x='50'>${emoji}</text></svg>`)}`;
  await Category.deleteMany({});
  const cats = await Category.insertMany([
    { name: "Electronics", slug: "electronics",   image: svgIcon("📱") },
    { name: "Home & Kitchen", slug: "home-kitchen", image: svgIcon("🏠") },
    { name: "Audio",        slug: "audio",         image: svgIcon("🎵") },
    { name: "Gadgets",      slug: "gadgets",       image: svgIcon("⚡") },
  ]);

  // --- Blocs ---
  await Bloc.deleteMany({});
  const img = (s) => `https://picsum.photos/seed/${s}/600/400`;
  await Bloc.insertMany([
    { title: "Pro Wireless Soundbar", description: "Premium 3D surround sound waves with integrated wireless heavy-duty subwoofer.", image: img("soundbar"), category: cats[2]._id, tags: ["soundbar","speaker","wireless","home theatre","bass"], originalPrice: 2400, blocPrice: 1240, maxSpots: 100, goal: 50, filledSpots: 78, endTime: hoursFromNow(8), rating: 4.8, reviewCount: 124, sku: "SL-2045", featured: true },
    { title: "Smart Tech Watch Set", description: "Fitness tracking, heart-rate monitor, AMOLED display with 7-day battery.", image: img("watch"), category: cats[0]._id, tags: ["smartwatch","watch","fitness","tracker","wearable"], originalPrice: 960, blocPrice: 480, maxSpots: 200, goal: 100, filledSpots: 156, endTime: hoursFromNow(14), rating: 4.6, reviewCount: 89, sku: "SW-1180", featured: true },
    { title: "Digital Kitchen Scale", description: "Precision 0.1g digital scale with tempered glass surface.", image: img("scale"), category: cats[1]._id, tags: ["scale","kitchen","cooking","baking","weight"], originalPrice: 800, blocPrice: 420, maxSpots: 150, goal: 75, filledSpots: 60, endTime: hoursFromNow(20), rating: 4.5, reviewCount: 41, sku: "DS-0090" },
    { title: "Wireless Gaming Mouse", description: "16000 DPI optical sensor, RGB, ultra-light honeycomb shell.", image: img("mouse"), category: cats[3]._id, tags: ["mouse","gaming","rgb","wireless","computer"], originalPrice: 1200, blocPrice: 640, maxSpots: 120, goal: 60, filledSpots: 95, endTime: hoursFromNow(5), rating: 4.7, reviewCount: 67, sku: "GM-3300", featured: true },
    { title: "Air Fryer 5.5L", description: "Oil-free cooking, 8 presets, digital touch panel.", image: img("airfryer"), category: cats[1]._id, tags: ["air fryer","kitchen","cooking","healthy","oil-free"], originalPrice: 5400, blocPrice: 3200, maxSpots: 80, goal: 40, filledSpots: 33, endTime: hoursFromNow(30), rating: 4.9, reviewCount: 210, sku: "AF-5500" },
    { title: "Noise-Cancel Headphones", description: "Active noise cancellation, 40h playtime, deep bass.", image: img("headphones"), category: cats[2]._id, tags: ["headphones","noise cancelling","anc","audio","music"], originalPrice: 3200, blocPrice: 1850, maxSpots: 100, goal: 50, filledSpots: 72, endTime: hoursFromNow(11), rating: 4.6, reviewCount: 98, sku: "HP-7700", featured: true },
  ]);

  // --- Orders ---
  await Order.deleteMany({});
  await Counter.deleteMany({ _id: "orderId" });
  const blocs = await Bloc.find({});
  const orderSeeds = [
    { user: customers[0]._id, bloc: blocs[1]._id, customerName: customers[0].name, mobile: customers[0].mobile, email: customers[0].email, address: customers[0].address, amount: blocs[1].blocPrice, status: "delivered" },
    { user: customers[1]._id, bloc: blocs[2]._id, customerName: customers[1].name, mobile: customers[1].mobile, email: customers[1].email, address: customers[1].address, amount: blocs[2].blocPrice, status: "processing" },
    { user: customers[2]._id, bloc: blocs[3]._id, customerName: customers[2].name, mobile: customers[2].mobile, email: customers[2].email, address: customers[2].address, amount: blocs[3].blocPrice, status: "confirmed" },
    { user: customers[3]._id, bloc: blocs[4]._id, customerName: customers[3].name, mobile: customers[3].mobile, email: customers[3].email, address: customers[3].address, amount: blocs[4].blocPrice, status: "pending" },
    { user: customers[0]._id, bloc: blocs[4]._id, customerName: customers[0].name, mobile: customers[0].mobile, email: customers[0].email, address: customers[0].address, amount: blocs[4].blocPrice, status: "delivered" },
    { user: customers[1]._id, bloc: blocs[0]._id, customerName: customers[1].name, mobile: customers[1].mobile, email: customers[1].email, address: customers[1].address, amount: blocs[0].blocPrice, status: "shipped" },
  ];
  for (const seed of orderSeeds) {
    await new Order({ ...seed, paymentMethod: "cod" }).save();
  }
  log("✓ Seeded 6 orders (DB001–DB006) linked to customers");

  // --- Content (CMS) ---
  await SiteContent.deleteMany({});
  await SiteContent.insertMany(defaultContent);

  log(`✓ Seeded ${cats.length} categories, 6 blocs, ${defaultContent.length} content items`);
}

// Auto-seed only if the DB looks empty (used on startup for in-memory DB).
export async function ensureSeeded(log = console.log) {
  const count = await Bloc.estimatedDocumentCount();
  if (count === 0) {
    log("Database empty — auto-seeding...");
    await seedDatabase({ log });
  }
}
