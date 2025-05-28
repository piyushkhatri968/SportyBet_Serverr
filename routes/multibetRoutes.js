const express = require("express");
const router = express.Router();
const Bet = require("../models/multibets");
const oddModel = require("../models/bet")
const cashout = require("../models/cashOut")


router.post("/multibets", async (req, res) => {
    try {
        console.log("📩 Received request body:", req.body); // ✅ Debugging Log

        const { userId, text, userId1 } = req.body;

        // ✅ Validate userId
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // ✅ Validate bet data
        if (!Array.isArray(text) || text.length === 0) {
            console.error("❌ No valid bets found in request.");
            return res.status(400).json({ message: "No valid bets found." });
        }

        const cashData = {
            betId: userId,
            amount: 0,
            cashoutStatus: "cashout"
        }

        await cashout.create(cashData)

        // ✅ Prepare bet objects for insertion
        const betsToInsert = text.map(bet => ({
            userId,
            gameId: bet?.gameId || null,
            dateTime: bet?.date || new Date(), // Default to now if missing
            teams: bet?.teams || "N/A",
            ftScore: bet?.ftScore || "N/A",
            pick: bet?.pick || "N/A",
            market: bet?.market || "N/A",
            outcome: bet?.outcome || "N/A",
            odd: bet?.odd || 1.0, // Default to 1.0 if missing
            createdAt: new Date(), // ✅ Store timestamp
            userId1: userId1 || null
        }));

        // ✅ Insert bets into MongoDB
        const savedBets = await Bet.insertMany(betsToInsert);

        console.log("✅ Bets successfully stored:", savedBets.length, "bets inserted");

        // ✅ Send success response
        return res.json({
            message: "Bets stored successfully",
            bets: savedBets
        });

    } catch (error) {
        console.error("❌ Error processing bets:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});


router.post("/add-match", async (req, res) => {
    try {
      const {userId, gameId, dateTime, teams, userId1 } = req.body;
  
      // Validation: Check if all fields are present
      if (!gameId || !dateTime || !teams) {
        return res.status(400).json({ message: "All fields are required" });
      }

     
      const cashData = {
        betId: userId,
        amount: 0,
        cashoutStatus: "cashout"
    };
    
    // Check if a record already exists
    const cashExistData = await cashout.findOne({ betId: userId });
    
    if (cashExistData) {
        // Update existing record
        await cashout.updateOne(
            { betId: userId },  // Filter
            { $set: cashData }  // Update values
        );
    } else {
        // Insert new record
        await cashout.create(cashData);
    }
  
      // Save to MongoDB
      const newMatch = new Bet({userId, gameId, dateTime, teams, userId1 });
      await newMatch.save();
  
      res.status(201).json({ message: "Match added successfully", match: newMatch });
    } catch (error) {
      console.error("❌ Error adding match:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

// **API to Fetch Stored Bets**
router.get("/multibets/:userId", async (req, res) => {
    try {
      const { userId } = req.params; // Get userId from request params
      const bets = await Bet.find({ userId }); // Find bets for the specific user
  
      if (!bets.length) {
        return res.status(404).json({ message: "No bets found for this user." });
      }
  
      res.json(bets);
    } catch (error) {
      console.error("Error fetching bets:", error); 
      res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/multibet/:userId1", async (req, res) => {
    try {
      const { userId1 } = req.params; // Get userId from request params
      const bets = await Bet.find({ userId1: userId1 }); // Find bets for the specific user
  
      if (!bets.length) {
        return res.status(404).json({ message: "No bets found for this user." });
      }
  
      res.json(bets);
    } catch (error) {
      console.error("Error fetching bets:", error); 
      res.status(500).json({ message: "Server error" });
    }
  });

  router.put("/multibets/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { market, pick, ftScore, outcome, status, odd, userId, chatNumber } = req.body;

        if (!id || !userId) {
            return res.status(400).json({ message: "Bet ID and User ID are required." });
        }

        const updatedBet = await Bet.findByIdAndUpdate(
            id,
            { market, pick, ftScore, outcome, status, odd,chatNumber }, // ✅ No changes to odd in Bet
            { new: true, runValidators: true }
        );

        if (!updatedBet) {
            return res.status(404).json({ message: "Bet not found." });
        }

        res.json(updatedBet); // ✅ Added this to return the updated bet
    } catch (error) {
        console.error("Error updating bet:", error);
        res.status(500).json({ message: "Error updating bet", error: error.message });
    }
});




router.put("/multibets/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { teams, gameId, dateTime } = req.body;

        // Find and update the bet entry
        const updatedBet = await Bet.findByIdAndUpdate(
            id,
            { teams, gameId, dateTime },
            { new: true } // Returns the updated document
        );

        if (!updatedBet) {
            return res.status(404).json({ message: "Bet not found" });
        }

        res.status(200).json({ message: "Bet updated successfully", updatedBet });
    } catch (error) {
        console.error("Error updating bet:", error);
        res.status(500).json({ message: "Error updating bet", error });
    }
});

router.put("/multibets/chat/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { chatNumber } = req.body;

        // Find and update the bet entry
        const updatedBet = await Bet.findByIdAndUpdate(
            id,
            { chatNumber },
            { new: true } // Returns the updated document
        );

        if (!updatedBet) {
            return res.status(404).json({ message: "Bet not found" });
        }

        res.status(200).json({ message: "Bet updated successfully", updatedBet });
    } catch (error) {
        console.error("Error updating bet:", error);
        res.status(500).json({ message: "Error updating bet", error });
    }
});

router.put("/multibets/liveodd/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { liveOdd } = req.body;

        // Find and update the bet entry
        const updatedBet = await Bet.findByIdAndUpdate(
            id,
            { liveOdd },
            { new: true } // Returns the updated document
        );

        if (!updatedBet) {
            return res.status(404).json({ message: "Bet not found" });
        }

        res.status(200).json({ message: "Bet updated successfully", updatedBet });
    } catch (error) {
        console.error("Error updating bet:", error);
        res.status(500).json({ message: "Error updating bet", error });
    }
});




  
module.exports = router;
