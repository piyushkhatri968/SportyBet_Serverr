const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bet",
        required: true,
      },
    gameId: String,
    dateTime: String,
    teams: String,
    ftScore: String,
    pick: String,
    market: String,
    outcome: String,
    status: String,
    odd: {type: String, default: 0.1},
    chatNumber: {type: String, default:0},
    userId1: String,
    liveOdd: String
  });

  module.exports = mongoose.model("multbet", BetSchema)