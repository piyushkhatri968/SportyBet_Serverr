const express = require("express");
const router = express.Router();
const Match = require("../models/Match");

// POST /api/matches - Save multiple matches
router.post("/matches", async (req, res) => {
  try {
    const matches = req.body.matches;

    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({ message: "No matches provided" });
    }

    const formattedMatches = matches.map((match) => ({
      matchId: Math.floor(Math.random() * 100000), // or use match.id if you have it
      time: match.time,
      league: match.league,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeOdd: match.homeOdd || "",
      drawOdd: match.drawOdd || "",
      awayOdd: match.awayOdd || "",
      points: match.points || "",
      isLive: match.isLive || false,
    }));

    const savedMatches = await Match.insertMany(formattedMatches);
    res.status(201).json(savedMatches);
  } catch (error) {
    console.error("Error saving matches:", error);
    res.status(500).json({ error: "Failed to save matches" });
  }
});

router.post("/matches/single", async (req, res) => {
  try {
    const {
      league,
      isLive,
      time,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      homeOdd,
      drawOdd,
      awayOdd,
      points,
      // Assuming 'day' is either optional or handled by schema default/frontend
    } = req.body;

    const match = new Match({
      league,
      time,
      // You might want to add a 'day' field here if it's required by your schema
      // For example: day: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      isLive: isLive || false,
      homeScore: homeScore || "0",
      awayScore: awayScore || "0",
      points: points || "0",
      homeTeam: homeTeam, // Directly assign if schema allows string
      awayTeam: awayTeam, // Directly assign if schema allows string
      homeOdd: homeOdd,
      drawOdd: drawOdd,
      awayOdd: awayOdd,
      hot: true,
      bestOdd:true
    });

    await match.save();
    res.status(201).json(match);
  } catch (error) {
    console.error("Error creating manual match:", error);
    res.status(500).json({ message: "Server error creating manual match", error: error.message });
  }
});


router.get("/matches", async (req, res) => {
  try {
    const matches = await Match.find().sort({ time: 1 }); // Optional: sort by match time
    res.status(200).json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// PATCH /api/matches/:id - Update a match by ID
router.patch("/matches/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const updateFields = req.body;
    console.log(updateFields)

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No update fields provided" });
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedMatch) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.status(200).json(updatedMatch);
  } catch (error) {
    console.error("Error updating match:", error);
    res.status(500).json({ error: "Failed to update match" });
  }
});

// PATCH /api/matches/:id/status - Update bestOdd and hot fields
router.patch("/matches/:id/status", async (req, res) => {
  try {
    const matchId = req.params.id;
    const { bestOdd, hot } = req.body;

    // Validate input
    if (typeof bestOdd === "undefined" && typeof hot === "undefined") {
      return res.status(400).json({ message: "No status fields provided" });
    }

    const updateFields = {};
    if (typeof bestOdd !== "undefined") updateFields.bestOdd = bestOdd;
    if (typeof hot !== "undefined") updateFields.hot = hot;

    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedMatch) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.status(200).json({
      message: "Match status updated successfully",
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Error updating match status:", error);
    res.status(500).json({ error: "Failed to update match status" });
  }
});



module.exports = router;
