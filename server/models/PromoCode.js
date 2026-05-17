import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema(
  {
    code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
    description:   { type: String, default: "" },
    discountType:  { type: String, enum: ["percentage", "flat"], required: true },
    discountValue: { type: Number, required: true, min: 0 },   // % or ₹ amount
    maxUses:       { type: Number, default: 0 },               // 0 = unlimited
    usedCount:     { type: Number, default: 0 },
    minAmount:     { type: Number, default: 0 },               // minimum cart value to apply
    expiresAt:     { type: Date, default: null },              // null = never expires
    isActive:      { type: Boolean, default: true },
    applicableTo:  { type: String, enum: ["courses", "tests", "all"], default: "all" },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Virtual: is the code currently usable?
promoCodeSchema.virtual("isValid").get(function () {
  if (!this.isActive) return false;
  if (this.maxUses > 0 && this.usedCount >= this.maxUses) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
});

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
export default PromoCode;
