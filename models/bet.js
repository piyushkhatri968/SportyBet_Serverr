const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  betCode: { type: String, required: true },
  stake: { type: Number, required: true },
  date: {
    type: Date, // Changed from String to Date
    required: true,
  },
  odd: { type: String, default: "0.1" },
  bookingCode: { type: String, default: "AASDSAD" },
  percentage: { type: Number, default: 10, min: 0, max: 100 }
});

const Bet = mongoose.model("Bet", betSchema);
module.exports = Bet;