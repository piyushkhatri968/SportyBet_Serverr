const mongoose = require("mongoose");

const UserBalanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  amount: { type: Number, default: 0 },
  currencyType: { type: String, enum: ["GHS", "NGN"], default: "GHS" },
});

module.exports = mongoose.model("UserBalance", UserBalanceSchema);
