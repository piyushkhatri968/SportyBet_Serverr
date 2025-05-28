const express = require("express");
const router = express.Router();
const oddModel = require("../models/oddModel");

// GET Odd by betId
router.get("/odd/:betId", async (req, res) => {
    try {
        const { betId } = req.params;
        const oddData = await oddModel.findOne({ betId });

        if (oddData) {
            res.json(oddData);
        } else {
            console.log("not found bet")
            // res.status(404).json({ error: "No odd value found for this betId" });
        }
    } catch (error) {
        console.log("server error")
        // res.status(500).json({ error: "Server error" });
    }
});

// ✅ Corrected PUT Request - Update Odd Value by betId
router.put("/odd/:betId", async (req, res) => {
    try {
        const { betId } = req.params;
        const { odd } = req.body;

        if (!odd) {
            return res.status(400).json({ error: "Odd value is required" });
        }

        // Check if betId exists in the database
        const existingOdd = await oddModel.findOne({ betId });

        if (existingOdd) {
            // Update existing odd value
            existingOdd.odd = odd;
            await existingOdd.save();
            return res.json({ message: "Odd value updated successfully", updatedOdd: existingOdd });
        }

        // If betId does not exist, create a new one
        const newOdd = new oddModel({ betId, odd });
        await newOdd.save();
        res.json({ message: "New odd value added", newOdd });

    } catch (error) {
        console.error("Error updating odd:", error);
        res.status(500).json({ error: "Error updating odd value" });
    }
});

module.exports = router;
