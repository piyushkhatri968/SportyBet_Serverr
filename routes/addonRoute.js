// routes/addons.js
const express = require("express");
const router = express.Router();
const Addon = require("../models/Addon");

// Create multiple addons at once
router.post("/addons/bulk", async (req, res) => {
  try {
    const addons = req.body.addons;

    if (!Array.isArray(addons) || addons.length === 0) {
      return res.status(400).json({ message: "No addons provided" });
    }

    const insertedAddons = await Addon.insertMany(addons, { ordered: false });
    res.status(201).json({ message: "Addons created successfully", data: insertedAddons });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create addons", error });
  }
});



// Create multiple addons at once
router.get("/addons", async (req, res) => {
  try {
    const addons = await Addon.find({ status: "active" });
    res.json(addons);
  } catch (err) {
    res.status(500).json({ message: "Failed to load addons" });
  }
});



module.exports = router;
