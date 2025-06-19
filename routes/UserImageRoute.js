const express = require('express');
const router = express.Router();
const UserImage = require('../models/UserImage');
const proImage = require('../models/Image');
const User = require('../models/user');

// ✅ GET: All available images from proImage
router.get('/profile-images', async (req, res) => {
  try {
    const images = await proImage.find().sort({ createdAt: -1 });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// ✅ PUT: Set selected image for a user (update or create)
router.put('/user-image/:userId', async (req, res) => {
  try {
    const { imageId } = req.body;
    const { userId } = req.params;

    if (!imageId) {
      return res.status(400).json({ message: 'imageId is required' });
    }

    // Check image exists
    const foundImage = await proImage.findById(imageId);
    if (!foundImage) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if already exists
    let userImage = await UserImage.findOne({ user: userId });

    if (userImage) {
      userImage.image = imageId;
      await userImage.save();
    } else {
      userImage = new UserImage({ user: userId, image: imageId });
      await userImage.save();
    }

    res.status(200).json({ message: 'User image updated', userImage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// ✅ GET: Get selected image for user
router.get('/user-image/:userId', async (req, res) => {
  try {
    const userImage = await UserImage.findOne({ user: req.params.userId }).populate('image');
    if (!userImage) {
      return res.status(404).json({ message: 'No image selected for user' });
    }
    res.json(userImage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
