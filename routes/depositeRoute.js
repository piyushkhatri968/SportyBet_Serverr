const express = require("express");
const router = express.Router();
const Deposit = require("../models/deposite");
const User = require("../models/user"); // ensure you have the User model


// ============================
// @route   POST /api/deposits/deposit
// @desc    Make a deposit
// ============================
router.post("/deposit", async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid deposit data" });
  }

  try {
    const deposit = await Deposit.findOneAndUpdate(
      { userId },
      { $inc: { amount: amount } },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Deposit processed successfully", deposit });
  } catch (error) {
    console.error("Deposit error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ============================
// @route   GET /api/deposits/deposite/:userId
// @desc    Get deposit history for a user
// ============================
router.get("/deposite/:userId", async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.params.userId }).sort({ date: -1 });
    res.status(200).json(deposits);
  } catch (error) {
    console.error("Get deposits error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ============================
// @route   POST /api/deposits/withdraw
// @desc    Withdraw funds & send SMS
// ============================
router.post("/withdraw", async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid withdrawal data" });
  }

  try {
    const deposit = await Deposit.findOne({ userId });

    if (!deposit || deposit.amount < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    deposit.amount -= amount;
    await deposit.save();

    // Send SMS notification


    res.status(200).json({ message: "Withdrawal successful", deposit });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ============================
// @route   PUT /api/deposits/update-currency
// @desc    Update currency type
// ============================
router.put("/update-currency", async (req, res) => {
  const { userId, currencyType } = req.body;

  if (!userId || !currencyType || !["GHS", "NGN"].includes(currencyType)) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  try {
    const deposit = await Deposit.findOneAndUpdate(
      { userId },
      { currencyType },
      { new: true }
    );

    if (!deposit) {
      return res.status(404).json({ message: "Deposit record not found" });
    }

    res.status(200).json({ message: "Currency updated successfully", deposit });
  } catch (error) {
    console.error("Currency update error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
