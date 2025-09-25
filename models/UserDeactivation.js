const mongoose = require("mongoose");

const userDeactivationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    unique: true 
  },
  isDeactivated: {
    type: Boolean,
    default: false,
  },
  deactivatedAt: {
    type: Date,
  },
  subscriptionPausedAt: {
    type: Date,
  },
  remainingSubscriptionDays: {
    type: Number,
    default: 0,
  },
  originalExpiryDate: {
    type: Date,
  },
  deactivationReason: {
    type: String,
    enum: ["user_request", "admin_action", "suspicious_activity", "other"],
    default: "user_request"
  },
  reactivatedAt: {
    type: Date,
  },
  reactivationCount: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model("UserDeactivation", userDeactivationSchema);
