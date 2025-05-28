const express = require("express");
const router = express.Router();
const Bet = require("../models/bet");
const Deposit =  require("../models/deposite")
const Match = require("../models/multibets")

// Fetch Bets for Logged-in User
router.get("/bets/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const bets = await Bet.find({ userId }); // Fetch bets for specific user
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: "Error fetching bets" });
  }
});

// Add a Bet
router.post("/bets", async (req, res) => {
    try {
      const { userId, date, betCode, stake, odd } = req.body;
  
      // Validate required fields
      if (!userId || !date || !betCode || !stake) {
        return res.status(400).json({ error: "All fields are required" });
      }

  
      // Validate data types
      if (isNaN(stake) || stake <= 0) {
        return res.status(400).json({ error: "Invalid stake value" });
      }

      const deposit = await Deposit.findOne({ userId });

    if (!deposit || deposit.amount < stake) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    deposit.amount -= stake;
    await deposit.save();

      const newBet = new Bet({ userId, date, betCode, stake, odd });
      const savedBet = await newBet.save();
    
      res.status(201).json(savedBet);
    } catch (error) {
      console.error("Error adding bet:", error.message);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Update Odd for a Bet
router.put("/bets/:betId", async (req, res) => {
  try {
    const { betId } = req.params;
    const { odd } = req.body;

    // Validate the odd value
    if (!odd || isNaN(odd) || odd <= 0) {
      return res.status(400).json({ error: "Invalid odd value" });
    }

    // Find and update the bet
    const updatedBet = await Bet.findByIdAndUpdate(
      betId,
      { $set: { odd } },
      { new: true }
    );

    if (!updatedBet) {
      return res.status(404).json({ error: "Bet not found" });
    }

    res.json(updatedBet);
  } catch (error) {
    console.error("Error updating bet odd:", error.message);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

router.put("/ticketId/:betId", async (req, res) => {
  try {
    const { betId } = req.params;
    const { betCode, date, stake, percentage } = req.body;

    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(betId)) {
      return res.status(400).json({ error: "Invalid betId" });
    }

    const bet = await Bet.findById(betId);
    if (!bet) {
      return res.status(404).json({ error: "Bet not found" });
    }

    const updateFields = {};

    // Handle betCode update
    if (betCode !== undefined) {
      if (typeof betCode !== "string" || betCode.trim() === "") {
        return res.status(400).json({ error: "Invalid betCode value" });
      }
      updateFields.betCode = betCode.trim();
    }

    // Handle date update
    if (date !== undefined) {
      if (typeof date !== "string" || !/^\d{2}\/\d{2}, \d{2}:\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Invalid date format. Expected DD/MM, HH:mm" });
      }
      updateFields.date = date;
    }

    // Handle stake update
    if (stake !== undefined) {
      const newStake = parseFloat(stake);
      if (isNaN(newStake) || newStake <= 0) {
        return res.status(400).json({ error: "Invalid stake value" });
      }

      const deposit = await Deposit.findOne({ userId: bet.userId });
      if (!deposit) {
        return res.status(400).json({ error: "Deposit record not found for user" });
      }

      const stakeDifference = newStake - bet.stake;

      if (stakeDifference > 0 && deposit.amount < stakeDifference) {
        return res.status(400).json({ error: "Insufficient balance to increase stake" });
      }

      // Adjust deposit based on the stake change
      deposit.amount -= stakeDifference;
      await deposit.save();

      updateFields.stake = newStake;
    }

    if (percentage !== undefined) {
      const newPercentage = parseFloat(percentage);
      if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
        return res.status(400).json({ error: "Percentage must be a number between 0 and 100" });
      }
      updateFields.percentage = newPercentage;
    }

    // Update the bet
    const updatedBet = await Bet.findByIdAndUpdate(
      betId,
      { $set: updateFields },
      { new: true }
    );

    res.json(updatedBet);
  } catch (error) {
    console.error("Error updating bet:", error.message);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});




router.put("/bookingcode/:betId", async (req, res) => {
  try {
    const { betId } = req.params;
    const { bookingCode } = req.body;


    // Find and update the bet
    const updatedBet = await Bet.findByIdAndUpdate(
      betId,
      { $set: { bookingCode } },
      { new: true }
    );

    if (!updatedBet) {
      return res.status(404).json({ error: "Bet not found" });
    }

    res.json(updatedBet);
  } catch (error) {
    console.error("Error updating bet odd:", error.message);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

router.delete("/bets/:betId", async (req, res) => {
  try {
    const { betId } = req.params;

    // Find the bet
    const bet = await Bet.findById(betId);
    if (!bet) {
      return res.status(404).json({ error: "Bet not found" });
    }

    // Find the user's deposit and refund the stake
    const deposit = await Deposit.findOne({ userId: bet.userId });
    if (deposit) {
      deposit.amount += bet.stake; // Refund the stake amount
      await deposit.save();
    }

    // Delete related matches
    await Match.deleteMany({ betId });

    // Delete the bet
    await Bet.findByIdAndDelete(betId);

    res.json({ message: "Bet and related matches deleted successfully" });
  } catch (error) {
    console.error("Error deleting bet:", error.message);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});
  
module.exports = router;
