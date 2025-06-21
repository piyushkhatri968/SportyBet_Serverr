const mongoose = require("mongoose");

const verifySchema = new mongoose.Schema({
  betId: { type: String, required: true },
  verifyCode: { type: String, unique: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 43200 // 12 hours in seconds
  }
});

module.exports = mongoose.model("VerifyCode", verifySchema);
