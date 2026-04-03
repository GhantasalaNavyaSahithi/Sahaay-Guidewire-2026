const express = require("express");
const router = express.Router();
const { calculatePremium, calculatePremiumQuote } = require("../controllers/premiumController");

router.get("/:area", calculatePremium);
router.post("/quote", calculatePremiumQuote);

module.exports = router;