const mongoose = require("mongoose");

const verifySchema = new mongoose.Schema({
  betId: { type: String, required: true },
  verifyCode: { type: String, unique: true },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("VerifyCode", verifySchema);
