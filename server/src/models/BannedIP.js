import mongoose from "mongoose";

const schema = new mongoose.Schema({ ips: { type: [String], default: [] } });

schema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

export default mongoose.models.BannedIP || mongoose.model("BannedIP", schema);
