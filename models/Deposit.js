const mongoose = require("mongoose");

const DepositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed"], default: "completed" },
  currencyType: { type: String, enum: ["GHS", "NGN"], default: "GHS" },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Deposit", DepositSchema);
