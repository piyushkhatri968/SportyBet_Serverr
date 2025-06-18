const express = require('express');
const router = express.Router();
const Image = require('../models/Image');

// Create image (store only URL)
router.post('/proimages', async (req, res) => {
  try {
    const images = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'An array of image objects is required.' });
    }

    // Validate each image
    const invalid = images.some(img => !img.imageUrl);
    if (invalid) {
      return res.status(400).json({ message: 'Each image must have an "imageUrl".' });
    }

    // Insert all images
    const savedImages = await Image.insertMany(images);
    res.status(201).json(savedImages);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Get all image URLs
router.get('/proimages', async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
});

module.exports = router;
