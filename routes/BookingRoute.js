// routes/betRoutes.js
const express = require("express");
const router = express.Router();
const BetModel = require("../models/bet");
const BookingModel = require("../models/BookingCode");
const MultBet = require("../models/multibets"); // 🟩 Import your multbet model


// Helper function to format date
const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  // Always use current time from device
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  return `${month}/${day}, ${hours}:${minutes}`;
};
;

router.post("/place", async (req, res) => {
  const { betId, stake, userId } = req.body; // userId is the logged-in user's ID

  if (!betId || !stake || stake <= 0 || !userId) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    let bet = await BetModel.findById(betId);

    if (!bet) {
      return res.status(404).json({ message: "Bet not found" });
    }

    let updatedBet;
    let message = "Bet placed successfully. Matches updated.";
    const currentTime = formatDate(new Date()); // ✅ current time

    if (bet.userId.toString() !== userId) {
      // Copy bet to the logged-in user's account
      const newBet = new BetModel({
        userId: userId,
        betCode: bet.betCode,
        date: currentTime, // ✅ store current time
        odd: bet.odd,
        bookingCode: bet.bookingCode,
        percentage: bet.percentage,
        stake: stake,
      });
      await newBet.save();

      const newBetId = newBet._id;

      // Copy matches to the new bet
      const originalMatches = await MultBet.find({ userId: betId });
      const newMatches = originalMatches.map((match) => ({
        ...match.toObject(),
        _id: undefined, // Clear the old _id to create new documents
        userId: newBetId, // userId here refers to betId
        userId1: userId, // userId1 refers to the logged-in user
        status: "Not Started",
      }));

      if (newMatches.length > 0) {
        await MultBet.insertMany(newMatches);
      }

      // Create booking for the new bet
      const newBooking = new BookingModel({ betId: newBetId });
      await newBooking.save();

      updatedBet = newBet;
      message = "Bet copied and placed successfully in your account. Matches added.";
    } else {
      // Update existing bet for the logged-in user
      updatedBet = await BetModel.findByIdAndUpdate(
        betId,
        { 
          stake,
          date: currentTime // ✅ update to current time
        },
        { new: true }
      );

      // Update status of matches
      await MultBet.updateMany(
        { userId: betId },
        { $set: { status: "Not Started" } }
      );

      // Create booking if it doesn't exist
      const existingBooking = await BookingModel.findOne({ betId });
      if (!existingBooking) {
        const newBooking = new BookingModel({ betId });
        await newBooking.save();
      }
    }

    res.status(200).json({
      message,
      bet: updatedBet,
    });
  } catch (err) {
    console.error("Error placing bet:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
