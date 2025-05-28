const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  league: String,
  time: String,
  day: String,
  bestOdd: {type: Boolean, default: true}, 
  hot: {type: Boolean, default: true}, 
  leftTeam: {
    name: String,
    logo: String,
  },
  rightTeam: {
    name: String,
    logo: String,
  },
  odds: {
    one: String,
    draw: String,
    two: String,
  },
  hot:{
    type:Boolean, default: true
  },
  bestOdd:{type:Boolean, default: true}
});

module.exports = mongoose.model("TopMatch", matchSchema);
