// models/NotificationBalance.js
const mongoose = require("mongoose");

const NotificationBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // each user has one virtual phone balance
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationBalance", NotificationBalanceSchema);
