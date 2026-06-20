import "dotenv/config";
import mongoose from "mongoose";
import Bloc from "../models/Bloc.js";

await mongoose.connect(process.env.MONGO_URI);
const blocs = await Bloc.find({}, "title slug").lean();
blocs.forEach(b => console.log(`"${b.title}" => "${b.slug || 'NO SLUG'}"`));
process.exit(0);
