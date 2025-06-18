// models/Addon.js
const mongoose = require("mongoose");

const addonSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  price: Number, // If 0, show "Active (free)", else show Buy button
  status: { type: String, default: "inactive" }, // "active", "inactive"
  key: String // unique key like "booking_edit", "verify_code"
});

module.exports = mongoose.model("Addon", addonSchema);
