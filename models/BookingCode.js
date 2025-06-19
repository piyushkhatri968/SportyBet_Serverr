// models/bookingModel.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  betId: { type: mongoose.Schema.Types.ObjectId, ref: "Bet", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);
