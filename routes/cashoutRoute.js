const express = require('express')
const router = express.Router();
const CashOutModel = require("../models/cashOut")

router.put("/cashout/:betId", async (req, res) => {
    const { betId } = req.params;
    const { cashStatus, amount } = req.body;
  
    try {
      let bet = await CashOutModel.findOne({ betId });
  
      if (bet) {
        // If bet exists, update cashStatus and amount
        bet.cashStatus = cashStatus;
        bet.amount = amount;
        await bet.save();
        return res.json({ success: true, message: "Cashout status updated", bet });
      } else {
        // If bet does not exist, create a new entry
        bet = new CashOutModel({ betId, cashStatus, amount });
        await bet.save();
        return res.json({ success: true, message: "record added", bet });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error });
    }
  });

  router.get("/cashout/:betId", async (req, res) => {
    const { betId } = req.params;

    try {
        const bet = await CashOutModel.findOne({ betId });
        if (bet) {
            return res.json({ success: true, bet });
        } else {
            return res.status(404).json({ success: false, message: "No record found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error });
    }
});

router.get("/cashout", async (req, res) => {

    try {
        const bet = await CashOutModel.find();
        if (bet) {
            return res.json({ success: true, bet });
        } else {
            return res.status(404).json({ success: false, message: "No record found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error });
    }
});
  

module.exports =router