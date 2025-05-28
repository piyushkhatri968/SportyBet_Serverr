const express = require("express");
const router = express.Router();
const VerifyModel = require('../models/verifycode')
router.get("/verify-code/:betId", async (req, res) => {
    try {
        const { betId } = req.params;
        const verifyData = await VerifyModel.findOne({ betId });

        if (verifyData) {
            res.json(verifyData);
        } else {
            res.json({ verifyCode: "No Code Found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Check if verifyCode exists: Update or Insert
router.put("/verify-code/:betId", async (req, res) => {
    try {
        const { betId } = req.params;
        const { verifyCode } = req.body;

        // Check if the verifyCode already exists
        const existingVerify = await VerifyModel.findOne({ verifyCode });

        if (existingVerify) {
            // Update existing verifyCode entry
            existingVerify.betId = betId;  // Update betId if needed
            await existingVerify.save();
            return res.json({ message: "Verify Code updated successfully", existingVerify });
        }

        // If verifyCode does not exist, create a new one
        const newVerify = new VerifyModel({ betId, verifyCode });
        await newVerify.save();
        res.json({ message: "New Verify Code added", newVerify });

    } catch (error) {
        res.status(500).json({ error: "Error updating code" });
    }
});

module.exports = router