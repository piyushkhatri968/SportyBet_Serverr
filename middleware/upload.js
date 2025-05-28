const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Folder where images will be stored
const uploadPath = path.join(__dirname, '..', 'uploads');

// Create folder if it doesn't exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.fieldname + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// ✅ Accept specific fields (leftLogo and rightLogo)
const upload = multer({ storage }).fields([
  { name: 'leftLogo', maxCount: 1 },
  { name: 'rightLogo', maxCount: 1 }
]);

module.exports = upload;
