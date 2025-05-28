// routes/topMatchRoute.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const matchController = require("../controllers/topMatchesController");

// Get all matches
router.get("/topmatches", matchController.getAllMatches);

// Create new match with single image upload
router.post("/topmatches", upload, matchController.createMatch);

// Update match and optionally replace image
router.put("/topmatches/:id", upload, matchController.updateMatch);
router.patch("/topmatch/:id", upload, matchController.updateMatches);
router.patch("/matchTop/:id", upload, matchController.topmatchUpda);

// Delete match
router.delete("/topmatches/:id", matchController.deleteMatch);

module.exports = router;
