const mongoose = require("mongoose");

const verifySchema = new mongoose.Schema({
    betId: { type: String, required: true }, 
    verifyCode: { type: String, unique: true }  // Ensure verifyCode is unique
});
module.exports = mongoose.model("VerifyCode", verifySchema);