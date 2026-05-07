import MockTest from "../models/MockTest.js";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * POST /purchases/test/:testId
 * Purchase a paid test.
 * - If buyer is a learner: creates one purchase record for themselves.
 * - If buyer is a parent:  creates purchase records for themselves AND each linked learner.
 */
export const purchaseTest = asyncHandler(async (req, res) => {
  const { testId } = req.params;

  const test = await MockTest.findById(testId);
  if (!test) { res.status(404); throw new Error("Test not found"); }
  if (test.pricingType !== "paid" || test.price <= 0) {
    res.status(400); throw new Error("This test is free — no purchase required");
  }

  const buyer = req.user;
  const buyerId = buyer._id;

  // Collect all user IDs that should receive access
  const recipientIds = [buyerId];

  if (buyer.role === "parent") {
    // Fetch parent's linked learners to also grant access
    const parentDoc = await User.findById(buyerId).select("linkedLearners");
    (parentDoc?.linkedLearners || []).forEach((lid) => {
      if (String(lid) !== String(buyerId)) recipientIds.push(lid);
    });
  }

  // Upsert a purchase record for each recipient (idempotent)
  const ops = recipientIds.map((userId) =>
    Purchase.findOneAndUpdate(
      { user: userId, test: testId },
      { user: userId, test: testId, amount: test.price, purchasedBy: buyerId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  );

  const results = await Promise.all(ops);

  res.status(201).json({
    message: "Purchase successful",
    test: { _id: test._id, title: test.title, price: test.price },
    recipientCount: results.length,
  });
});

/**
 * GET /purchases/mine
 * Returns an array of test IDs the current user has purchased.
 */
export const getMyPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ user: req.user._id }).select("test");
  res.json(purchases.map((p) => String(p.test)));
});
