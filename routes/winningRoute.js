const express = require("express");
const router = express.Router();
const Deposit = require("../models/deposite");
const Winning = require("../models/winningModel");

router.post("/winning", async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid winning data" });
  }

  try {
    // 1. Create a new Winning record
    const newWinning = new Winning({
      userId,
      amount,
      date: new Date(), // Optional: for timestamping
    });
    await newWinning.save();

    // 2. Update (or create) Deposit record
    const deposit = await Deposit.findOneAndUpdate(
      { userId },
      { $inc: { amount: amount } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Winning processed successfully",
      deposit,
      winning: newWinning,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router