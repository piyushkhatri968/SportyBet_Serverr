// routes/userAddons.js
const express = require("express");
const router = express.Router();
const UserAddon = require("../models/UserAddon");
const Addon = require("../models/Addon");

// POST: user buys addon
router.post("/addon/buy", async (req, res) => {
  const { userId, addonId } = req.body;

  try {
    const addon = await Addon.findById(addonId);
    if (!addon) return res.status(404).json({ message: "Addon not found" });

    if (addon.price === 0)
      return res.status(400).json({ message: "This addon is free" });

    const existing = await UserAddon.findOne({ userId, addonId });

    if (existing) {
      // Toggle status between 'active' and 'inactive'
      existing.status = existing.status === 'active' ? 'inactive' : 'active';
      await existing.save();
      return res.json({
        message: `Addon has been ${existing.status}`,
        addon: existing,
      });
    }

    // New Addon Purchase
    const newUserAddon = new UserAddon({
      userId,
      addonId,
      status: 'active', // correct enum value
    });

    await newUserAddon.save();

    res.json({
      message: "Addon purchased and activated successfully",
      addon: newUserAddon,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// routes/userAddons.js
// GET: All addons with user-specific active status
router.get("/all/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [addons, userAddons] = await Promise.all([
      Addon.find(),
      UserAddon.find({ userId }).select("addonId status")
    ]);

    // Create a map of addonId => status
    const addonStatusMap = {};
    userAddons.forEach((ua) => {
      addonStatusMap[ua.addonId.toString()] = ua.status;
    });

    const result = addons.map((addon) => {
      const status = addonStatusMap[addon._id.toString()];
      return {
        ...addon._doc,
        isActive: status === "active"
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
