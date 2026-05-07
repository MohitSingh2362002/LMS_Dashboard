import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
    test:        { type: mongoose.Schema.Types.ObjectId, ref: "MockTest", required: true },
    amount:      { type: Number, required: true, min: 0 },
    purchasedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true }, // original buyer
  },
  { timestamps: true }
);

// One purchase record per user per test
purchaseSchema.index({ user: 1, test: 1 }, { unique: true });

export default mongoose.model("Purchase", purchaseSchema);
