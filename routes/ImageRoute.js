const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../configCloudinary");
const ImageModel = require("../models/ImagesModel");

const router = express.Router();

// Configure Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

// Helper function to delete images from Cloudinary
const deleteImagesFromCloudinary = async (imageUrls) => {
  try {
    for (let url of imageUrls) {
      const publicId = url.split("/").pop().split(".")[0]; // Extract public_id from URL
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Error deleting images from Cloudinary:", error);
  }
};

// Update images if they exist, otherwise create a new entry
router.post("/uploadImages", upload.array("images", 4), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Please upload at least one image." });
    }

    // Extract Cloudinary URLs
    const imageUrls = req.files.map((file) => file.path);

    // Find existing image document
    let existingImages = await ImageModel.findOne();

    if (existingImages) {
      // Delete previous images from Cloudinary before updating
      await deleteImagesFromCloudinary(existingImages.images);

      // Update existing images
      existingImages.images = imageUrls;
      await existingImages.save();
      return res.status(200).json({ message: "Images updated successfully!", data: existingImages });
    } else {
      // Save new images if none exist
      const newImages = new ImageModel({ images: imageUrls });
      await newImages.save();
      return res.status(201).json({ message: "Images uploaded successfully!", data: newImages });
    }
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

router.get("/getImages", async (req, res) => {
    try {
      // Find the images from the database
      const images = await ImageModel.findOne();
      
      // If no images are found, return a message
      if (!images) {
        return res.status(404).json({ message: "No images found" });
      }
      
      // Return the images data
      res.status(200).json({ message: "Images retrieved successfully", data: images });
    } catch (error) {
      // Handle any errors that occur during the request
      res.status(500).json({ message: "Failed to retrieve images", error: error.message });
    }
  });

module.exports = router;
