const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const UserBalance = require("../models/UserBalance");

// 📥 POST /api/wallet/deposit
router.post("/deposit", async (req, res) => {
  const { userId, amount, currencyType = "NGN" } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid deposit data" });
  }

  try {
    // 1. Save deposit history
    await Deposit.create({ userId, amount, currencyType });

    // 2. Update or create user balance
    const balance = await UserBalance.findOneAndUpdate(
      { userId },
      { $inc: { amount: amount }, $set: { currencyType } },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Deposit successful", balance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 💸 POST /api/wallet/withdraw
router.post("/withdraw", async (req, res) => {
  const { userId, amount, currencyType = "NGN" } = req.body;

  if (!userId || !amount || amount <= 0 || !method) {
    return res.status(400).json({ message: "Invalid withdrawal data" });
  }

  try {
    const userBalance = await UserBalance.findOne({ userId });

    if (!userBalance || userBalance.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 1. Save withdraw history
    await Withdraw.create({ userId, amount, currencyType });

    // 2. Deduct from balance
    userBalance.amount -= amount;
    await userBalance.save();

    res.status(200).json({ message: "Withdrawal successful", amount: userBalance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📊 GET /api/wallet/history/:userId
router.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const deposits = await Deposit.find({ userId }).lean();
    const withdrawals = await Withdraw.find({ userId }).lean();

    const history = [
      ...deposits.map(d => ({ type: "deposit", ...d })),
      ...withdrawals.map(w => ({ type: "withdraw", ...w })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 📟 GET /api/wallet/balance/:userId
router.get("/deposite/:userId", async (req, res) => {
  try {
    const balance = await UserBalance.findOne({ userId: req.params.userId });

    if (!balance) return res.status(404).json({ message: "No balance found" });

    res.status(200).json({ balance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/update-currency", async (req, res) => {
  const { userId, currencyType } = req.body;

  if (!userId || !currencyType || !["GHS", "NGN"].includes(currencyType)) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  try {
    // Update only the currencyType field
    const deposit = await UserBalance.findOneAndUpdate(
      { userId },
      { currencyType },
      { new: true }
    );

    if (!deposit) {
      return res.status(404).json({ message: "Deposit record not found" });
    }

    res.status(200).json({ message: "Currency updated successfully", deposit });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


module.exports = router;
