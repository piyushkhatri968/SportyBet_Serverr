const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  images: {
    type: [String], // Array of image URLs
    required: true,
  },
});

module.exports = mongoose.model("Image", ImageSchema);
