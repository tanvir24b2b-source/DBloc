import mongoose from "mongoose";

const blocRequestSchema = new mongoose.Schema(
  {
    bloc:        { type: mongoose.Schema.Types.ObjectId, ref: "Bloc", required: true },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerName:{ type: String, trim: true, default: "" },
    mobile:      { type: String, trim: true, default: "" },
    note:        { type: String, trim: true, default: "" },
    status:      { type: String, enum: ["pending", "reviewed", "launched", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

blocRequestSchema.index({ bloc: 1 });
blocRequestSchema.index({ user: 1 });

export default mongoose.model("BlocRequest", blocRequestSchema);
