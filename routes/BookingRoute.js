// routes/betRoutes.js
const express = require("express");
const router = express.Router();
const BetModel = require("../models/bet");
const BookingModel = require("../models/BookingCode");
const MultBet = require("../models/multibets"); // 🟩 Import your multbet model

router.post("/place", async (req, res) => {
  const { betId, stake } = req.body;

  if (!betId || !stake || stake <= 0) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    // ✅ Update stake in Bet model
    const updatedBet = await BetModel.findByIdAndUpdate(
      betId,
      { stake },
      { new: true }
    );

    if (!updatedBet) {
      return res.status(404).json({ message: "Bet not found" });
    }

    // ✅ Update status of all matches in multbet where userId === betId
    await MultBet.updateMany(
      { userId: betId }, // 🔁 match using userId (which represents betId here)
      { $set: { status: "Not Started" } }
    );

    // ✅ Create booking if it doesn't exist
    const existingBooking = await BookingModel.findOne({ betId });
    if (!existingBooking) {
      const newBooking = new BookingModel({ betId });
      await newBooking.save();
    }

    res.status(200).json({
      message: "Bet placed successfully. Matches updated.",
      bet: updatedBet,
    });
  } catch (err) {
    console.error("Error placing bet:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
