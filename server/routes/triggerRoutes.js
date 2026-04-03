const express = require("express");
const router = express.Router();
const { getTriggersFeed, scanTriggers } = require("../controllers/triggerController");

router.get("/feed", getTriggersFeed);
router.get("/scan", scanTriggers);

module.exports = router;