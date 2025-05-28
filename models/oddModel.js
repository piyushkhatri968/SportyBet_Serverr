const mongoose = require("mongoose");

const oddSchema = new mongoose.Schema({
    betId: { type: String, required: true }, 
    odd: Number  // Ensure verifyCode is unique
});

module.exports = mongoose.model("odd", oddSchema)