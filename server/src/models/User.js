import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, trim: true },
    address: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "moderator", "subadmin", "admin", "master_admin"], default: "user" },
    permissions: [{ type: String }], // staff: which admin areas they can manage
    banned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);
