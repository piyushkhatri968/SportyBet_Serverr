const express = require("express");
const router = express.Router();
const Winning = require("../models/winningModel");
const UserBalance = require("../models/UserBalance");

// Helper function to clean and validate amount
const getCleanedAmount = (val) => {
  if (typeof val === "string") {
    // Remove commas and convert to number
    const cleaned = val.replace(/,/g, "");
    const num = parseFloat(cleaned);
    if (isNaN(num)) {
      throw new Error("Invalid amount format");
    }
    return num;
  }
  if (typeof val === "number") {
    return val;
  }
  throw new Error("Amount must be a number or string");
};

router.post("/winning", async (req, res) => {
  const { userId, amount, currencyType = "NGN" } = req.body;

  // Validate inputs
  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    // Clean and validate amount
    const cleanedAmount = getCleanedAmount(amount);

    // Optional: Allow negative amounts if valid for your use case
    // If only positive amounts are allowed, uncomment the following:
    // if (cleanedAmount <= 0) {
    //   return res.status(400).json({ message: "Amount must be greater than 0" });
    // }

    // 1. Save winning history
    await Winning.create({
      userId,
      amount: cleanedAmount,
      currencyType,
      date: new Date(),
    });

    // 2. Update or create user balance
    const balance = await UserBalance.findOneAndUpdate(
      { userId },
      { $inc: { amount: cleanedAmount }, $set: { currencyType } },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Winning added successfully", balance });
  } catch (error) {
    console.error("Error processing winning:", error);
    res.status(400).json({ message: error.message || "Server error" });
  }
});

module.exports = router;