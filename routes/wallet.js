const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const UserBalance = require("../models/UserBalance");
const moment = require("moment");
const Bet = require("../models/bet");
const Winning = require("../models/winningModel");

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
  const { userId, amount, method='mobile_money', currencyType = "NGN" } = req.body;

  // Validation
  if (!userId || !amount || amount <= 0 || !method) {
    return res.status(400).json({ message: "Invalid withdrawal data" });
  }

  try {
    const userBalance = await UserBalance.findOne({ userId });

    if (!userBalance || userBalance.amount < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 1. Save withdraw history
    await Withdraw.create({ userId, amount, method, currencyType }); // ✅ include method

    // 2. Deduct from balance
    userBalance.amount -= amount;
    await userBalance.save();

    res.status(200).json({ message: "Withdrawal successful", amount: userBalance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// 📊 GET /api/wallet/history/:userId
const parseDateString = (dateStr) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        // Assume YY format is 20YY, for current year's dates
        // This logic might need refinement for years far in the past/future
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
        let year = parseInt(parts[2], 10);
        if (year < 100) {
            // Simple logic for YY to YYYY. Adjust if your date logic needs to span centuries.
            year += (year > (new Date().getFullYear() % 100) + 10) ? 1900 : 2000;
        }
        return new Date(year, month, day);
    }
    return null;
};

router.get("/history/:userId", async (req, res) => {
    const { userId } = req.params;
    const { dateRange, category } = req.query; // Get query parameters

    let filter = { userId: userId };
    let startDate, endDate;

    // 1. Handle Date Range Filtering
    if (dateRange) {
        if (dateRange.includes('-')) {
            // Specific date range (e.g., "01/06/25-07/06/25")
            const [startStr, endStr] = dateRange.split('-');
            startDate = parseDateString(startStr);
            endDate = parseDateString(endStr);

            if (startDate && endDate) {
                // Adjust endDate to include the whole day
                endDate.setHours(23, 59, 59, 999);
            } else {
                return res.status(400).json({ message: "Invalid dateRange format (DD/MM/YY-DD/MM/YY)." });
            }
        } else if (dateRange.startsWith('Last ')) {
            // Relative date range (e.g., "Last 7 days", "Last 14 days", "Last 30 days")
            const numDays = parseInt(dateRange.replace('Last ', '').replace(' days', ''), 10);
            if (!isNaN(numDays)) {
                endDate = moment().endOf('day').toDate(); // Today, end of day
                // Subtract (numDays - 1) because "Last 7 days" includes today
                startDate = moment().subtract(numDays - 1, 'days').startOf('day').toDate();
            } else {
                // Default or error for unhandled relative ranges
                return res.status(400).json({ message: "Invalid dateRange format for relative dates." });
            }
        }
        // Apply date filter if dates are valid
        if (startDate && endDate) {
            filter.date = { $gte: startDate, $lte: endDate };
        }
    }

    try {
        let deposits = [];
        let withdrawals = [];
        let bets=[]
        let Winnings=[]

        // 2. Handle Category Filtering (and apply date filter to individual queries)
        if (!category || category === 'All' || category === 'Deposits') {
            deposits = await Deposit.find(filter).lean();
        }
        if (!category || category === 'All' || category === 'Withdrawals') {
            withdrawals = await Withdraw.find(filter).lean();
        }
         if (!category || category === 'All' || category === 'Winnings') {
            Winnings = await Winning.find(filter).lean();
        }
         if (!category || category === 'All' || category === 'Bets') {
            bets = await Bet.find(filter).lean();
        }

        // 3. Combine and Map to a consistent format
        const combinedHistory = [
            ...deposits.map(d => ({ 
                id: d._id, // Keep original ID if needed
                type: "Deposits", // Standardize type for frontend
                date: moment(d.date).format('DD/MM/YY'), // Format date
                amount: d.amount,
                description: d.description,
                status: d.status || 'Completed' // Provide a default status if none exists
            })),
            ...withdrawals.map(w => ({
                id: w._id,
                type: "Withdrawals", // Standardize type for frontend
                date: moment(w.date).format('DD/MM/YY'), // Format date
                amount: w.amount * -1, // Withdrawals should be negative for frontend
                description: w.description,
                status: w.status || 'Completed' // Provide a default status if none exists
            })),
             ...Winnings.map(w => ({
                id: w._id,
                type: "Winnings", // Standardize type for frontend
                date: moment(w.date).format('DD/MM/YY'), // Format date
                amount: w.amount * -1, // Withdrawals should be negative for frontend
                description: w.description,
                status: w.status || 'Completed' // Provide a default status if none exists
            })),
            ...bets.map(w => ({
                id: w._id,
                type: "bets", // Standardize type for frontend
                date: moment(w.date).format('YY/MM/DD'), // Format date
                amount: w.stake, // Withdrawals should be negative for frontend
                description: w.description,
                status: w.status || 'Completed' // Provide a default status if none exists
            })),
        ];

        // Sort by date (most recent first)
        combinedHistory.sort((a, b) => {
            // Convert 'DD/MM/YY' back to Date objects for accurate sorting
            const dateA = moment(a.date, 'DD/MM/YY').toDate();
            const dateB = moment(b.date, 'DD/MM/YY').toDate();
            return dateB.getTime() - dateA.getTime();
        });

        // 4. Send the array directly, as expected by your frontend FlatList
        res.status(200).json(combinedHistory);

    } catch (error) {
        console.error("Server error fetching history:", error);
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


router.delete("/transaction/:transactionId", async (req, res) => {
  const { transactionId } = req.params;

  try {
    // Try to delete from Deposit collection first
    let deleted = await Deposit.findByIdAndDelete(transactionId);

    if (deleted) {
      return res.status(200).json({ message: "Deleted from Deposits" });
    }

    // If not found in Deposit, try Withdraw
    deleted = await Withdraw.findByIdAndDelete(transactionId);

    if (deleted) {
      return res.status(200).json({ message: "Deleted from Withdrawals" });
    }

    return res.status(404).json({ message: "Transaction not found in either collection" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.delete("/transactions/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const depositResult = await Deposit.deleteMany({ userId });
    const withdrawResult = await Withdraw.deleteMany({ userId });

    const totalDeleted = depositResult.deletedCount + withdrawResult.deletedCount;

    res.status(200).json({
      message: `Deleted ${totalDeleted} transaction(s) for user ${userId}`,
      depositsDeleted: depositResult.deletedCount,
      withdrawalsDeleted: withdrawResult.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;
