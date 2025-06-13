const express = require("express");
const router = express.Router();
const Winning = require("../models/winningModel");
const UserBalance = require("../models/UserBalance"); // Make sure this is correct

router.post("/winning", async (req, res) => {
  const { userId, amount, currencyType = "NGN" } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid winning data" });
  }

  try {
    // 1. Save winning history
    await Winning.create({ userId, amount, currencyType, date: new Date() });

    // 2. Update or create user balance
    const balance = await UserBalance.findOneAndUpdate(
      { userId },
      { $inc: { amount }, $set: { currencyType } },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Winning added successfully", balance });
  } catch (error) {
    console.error("Error processing winning:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
