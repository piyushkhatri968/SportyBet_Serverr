// models/UserAddon.js
const mongoose = require("mongoose");

const userAddonSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  addonId: { type: mongoose.Schema.Types.ObjectId, ref: "Addon" },
  status: { type: String, enum: ["active"], default: "active" },
  purchasedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserAddon", userAddonSchema);
