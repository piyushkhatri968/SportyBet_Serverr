const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../configCloudinary");
const ImageModel = require("../models/ImagesModel");
const sharp = require("sharp");

const router = express.Router();

// Function to validate image dimensions
const validateImageDimensions = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    const { width, height } = metadata;
    
    console.log('Image dimensions:', { width, height });
    
    if (width === 720 && height === 128) {
      return { valid: true };
    } else {
      return { 
        valid: false, 
        error: `Image dimensions must be exactly 720x128 pixels. Current dimensions: ${width}x${height} pixels.` 
      };
    }
  } catch (error) {
    console.error('Error validating image dimensions:', error);
    return { 
      valid: false, 
      error: 'Failed to validate image dimensions.' 
    };
  }
};

// Configure Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sportybet-uploads",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 720, height: 128, crop: "fill" }], // Exact banner dimensions
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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

    // Validate dimensions for all uploaded images
    for (let i = 0; i < req.files.length; i++) {
      const validation = await validateImageDimensions(req.files[i].path);
      if (!validation.valid) {
        console.log(`Image ${i + 1} dimension validation failed:`, validation.error);
        return res.status(400).json({ 
          message: `Invalid image dimensions for image ${i + 1}`, 
          error: validation.error 
        });
      }
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

// Upload single image and update specific banner position
router.post("/uploadSingleImage", upload.single("images"), async (req, res) => {
  try {
    console.log('Upload request received:', {
      hasFile: !!req.file,
      bannerIndex: req.body.bannerIndex,
      fileInfo: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: "Please upload an image." });
    }

    // Validate image dimensions before processing
    const validation = await validateImageDimensions(req.file.path);
    if (!validation.valid) {
      console.log('Image dimension validation failed:', validation.error);
      return res.status(400).json({ 
        message: "Invalid image dimensions", 
        error: validation.error 
      });
    }

    const imageUrl = req.file.path;
    const bannerIndex = parseInt(req.body.bannerIndex) || 0;

    console.log('Processing upload:', { imageUrl, bannerIndex });

    // Find existing image document
    let existingImages = await ImageModel.findOne();

    if (existingImages) {
      // Ensure we have an array of 4 images
      if (!existingImages.images || existingImages.images.length === 0) {
        existingImages.images = new Array(4).fill(null);
      }
      
      // Update the specific banner image
      existingImages.images[bannerIndex] = imageUrl;
      await existingImages.save();
      
      console.log('Banner updated successfully:', existingImages);
      return res.status(200).json({ 
        message: "Banner image updated successfully!", 
        imageUrl: imageUrl,
        data: existingImages 
      });
    } else {
      // Create new images array with the uploaded image at the specified position
      const images = new Array(4).fill(null);
      images[bannerIndex] = imageUrl;
      
      const newImages = new ImageModel({ images: images });
      await newImages.save();
      
      console.log('New banner created successfully:', newImages);
      return res.status(201).json({ 
        message: "Banner image uploaded successfully!", 
        imageUrl: imageUrl,
        data: newImages 
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: "Upload failed", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get("/getImages", async (req, res) => {
    try {
      // Find the images from the database
      const images = await ImageModel.findOne();
      
      // If no images are found, return empty array instead of 404
      if (!images) {
        return res.status(200).json({ 
          message: "No images found", 
          data: { images: [] } 
        });
      }
      
      // Return the images data
      res.status(200).json({ message: "Images retrieved successfully", data: images });
    } catch (error) {
      // Handle any errors that occur during the request
      res.status(500).json({ message: "Failed to retrieve images", error: error.message });
    }
  });

module.exports = router;
