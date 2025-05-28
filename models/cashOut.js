const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema({
  betId: { type: String, required: true },
  amount: { type: Number, default: 0.9 },
  cashStatus: { type: String, enum: ["cashout", "unavailable"], default: "cashout" },
});

module.exports = mongoose.model("cashout", BetSchema);
