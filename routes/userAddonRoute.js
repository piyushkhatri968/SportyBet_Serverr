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
      // Toggle active status
      existing.isActive = !existing.isActive;
      await existing.save();
      return res.json({
        message: `Addon has been ${existing.isActive ? "activated" : "deactivated"}`,
        addon: existing,
      });
    }

    const newUserAddon = new UserAddon({
      userId,
      addonId,
      isActive: true,
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
router.get("/all/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [addons, userAddons] = await Promise.all([
      Addon.find(),
      UserAddon.find({ userId }).select("addonId")
    ]);

    const activeAddonIds = userAddons.map((ua) => ua.addonId.toString());

    const result = addons.map((addon) => ({
      ...addon._doc,
      isActive: addon.price === 0 || activeAddonIds.includes(addon._id.toString())
    }));

    res.json(result);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
