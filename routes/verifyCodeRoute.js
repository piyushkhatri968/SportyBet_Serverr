const express = require("express");
const router = express.Router();
const VerifyModel = require('../models/verifycode')
const bet =require("../models/bet")
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

router.get("/betverify-code/:verifyCode", async (req, res) => {
  try {
    const { verifyCode } = req.params;

    // Step 1: Find the record with the given verify code
    const verifyRecord = await VerifyModel.findOne({ verifyCode });
    console.log(verifyRecord);

    if (!verifyRecord) {
      return res.status(404).json({ message: "Verify code not found." });
    }

    // Step 2: Check if the verify code is within 24 hours
    const now = new Date();
    const expiryTime = new Date(verifyRecord.createdAt);
    expiryTime.setHours(expiryTime.getHours() + 24); // add 24 hours

    if (now > expiryTime) {
      return res.status(400).json({ message: "Verify code expired." });
    }

    // Step 3: Use the betId from that record to find the match
    const match = await bet.findOne({ _id: verifyRecord.betId });

    if (!match) {
      return res
        .status(404)
        .json({ message: "Match not found for given verify code." });
    }

    res.status(200).json({ match });
  } catch (err) {
    console.error("Error fetching match:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router
