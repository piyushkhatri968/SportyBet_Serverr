// routes/betRoutes.js
const express = require("express");
const router = express.Router();
const BetModel = require("../models/bet");
const BookingModel = require("../models/BookingCode"); // ✅ NEW


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

    // ✅ Generate and store booking code separately
  

    const newBooking = new BookingModel({
      betId
    });

    await newBooking.save();

    res.status(200).json({
      message: "Bet placed successfully",
      bet: updatedBet,
    });
  } catch (err) {
    console.error("Error placing bet:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
