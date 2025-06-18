// models/Addon.js
const mongoose = require("mongoose");

const addonSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  price: Number, // 0 = free, >0 = paid
  key: String, // unique identifier like "verify_code"
});

module.exports = mongoose.model("Addon", addonSchema);
