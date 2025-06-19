const mongoose = require('mongoose');

const userImageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'proImage',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('UserImage', userImageSchema);
