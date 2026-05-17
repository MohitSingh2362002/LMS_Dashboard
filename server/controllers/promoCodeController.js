import asyncHandler from "../utils/asyncHandler.js";
import PromoCode from "../models/PromoCode.js";

// ── Admin: list all promo codes ────────────────────────────────────────────
export const getAllPromoCodes = asyncHandler(async (req, res) => {
  const codes = await PromoCode.find().sort({ createdAt: -1 }).populate("createdBy", "name");
  res.json(codes);
});

// ── Admin: create a promo code ─────────────────────────────────────────────
export const createPromoCode = asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, maxUses, minAmount, expiresAt, isActive, applicableTo } = req.body;

  if (!code || !discountType || discountValue == null) {
    res.status(400); throw new Error("code, discountType, and discountValue are required");
  }
  if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
    res.status(400); throw new Error("Percentage discount must be between 1 and 100");
  }

  const promo = await PromoCode.create({
    code: code.toUpperCase().trim(),
    description,
    discountType,
    discountValue,
    maxUses:      maxUses      ?? 0,
    minAmount:    minAmount    ?? 0,
    expiresAt:    expiresAt    || null,
    isActive:     isActive     ?? true,
    applicableTo: applicableTo ?? "all",
    createdBy:    req.user._id,
  });

  res.status(201).json(promo);
});

// ── Admin: update a promo code ─────────────────────────────────────────────
export const updatePromoCode = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findById(req.params.id);
  if (!promo) { res.status(404); throw new Error("Promo code not found"); }

  const fields = ["description", "discountType", "discountValue", "maxUses", "minAmount", "expiresAt", "isActive", "applicableTo"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) promo[f] = req.body[f];
  });
  // Allow updating code too (re-normalise)
  if (req.body.code) promo.code = req.body.code.toUpperCase().trim();

  const updated = await promo.save();
  res.json(updated);
});

// ── Admin: delete a promo code ─────────────────────────────────────────────
export const deletePromoCode = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findByIdAndDelete(req.params.id);
  if (!promo) { res.status(404); throw new Error("Promo code not found"); }
  res.json({ message: "Promo code deleted" });
});

// ── Admin: reset usedCount ─────────────────────────────────────────────────
export const resetPromoCodeUsage = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findById(req.params.id);
  if (!promo) { res.status(404); throw new Error("Promo code not found"); }
  promo.usedCount = 0;
  await promo.save();
  res.json({ message: "Usage reset", promo });
});

// ── Learner: validate a promo code ────────────────────────────────────────
export const validatePromoCode = asyncHandler(async (req, res) => {
  const { code, type, amount } = req.body; // type: 'course' | 'test'

  if (!code) { res.status(400); throw new Error("Promo code is required"); }

  const promo = await PromoCode.findOne({ code: code.toUpperCase().trim() });

  if (!promo) {
    return res.status(404).json({ valid: false, message: "Invalid promo code" });
  }
  if (!promo.isActive) {
    return res.status(400).json({ valid: false, message: "This promo code is inactive" });
  }
  if (promo.expiresAt && new Date() > promo.expiresAt) {
    return res.status(400).json({ valid: false, message: "This promo code has expired" });
  }
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return res.status(400).json({ valid: false, message: "This promo code has reached its usage limit" });
  }

  // Check applicability
  if (type && promo.applicableTo !== "all") {
    const map = { course: "courses", test: "tests" };
    if (promo.applicableTo !== map[type]) {
      return res.status(400).json({
        valid: false,
        message: `This code is only valid for ${promo.applicableTo}`,
      });
    }
  }

  // Check minimum amount
  const cartAmount = parseFloat(amount) || 0;
  if (promo.minAmount > 0 && cartAmount < promo.minAmount) {
    return res.status(400).json({
      valid: false,
      message: `Minimum order value ₹${promo.minAmount} required`,
    });
  }

  // Calculate discount
  let discount = 0;
  if (promo.discountType === "percentage") {
    discount = Math.round((cartAmount * promo.discountValue) / 100);
  } else {
    discount = Math.min(promo.discountValue, cartAmount); // flat can't exceed price
  }

  const finalAmount = Math.max(0, cartAmount - discount);

  res.json({
    valid: true,
    promoCodeId: promo._id,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discount,
    finalAmount,
    message: promo.discountType === "percentage"
      ? `${promo.discountValue}% off applied! You save ₹${discount}`
      : `Flat ₹${discount} off applied!`,
  });
});

// ── Learner/Purchase: apply (increment usedCount) after successful purchase ─
export const applyPromoCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) { res.status(400); throw new Error("code is required"); }

  const promo = await PromoCode.findOne({ code: code.toUpperCase().trim() });
  if (!promo) { res.status(404); throw new Error("Promo code not found"); }

  promo.usedCount += 1;
  await promo.save();
  res.json({ message: "Applied", usedCount: promo.usedCount });
});
