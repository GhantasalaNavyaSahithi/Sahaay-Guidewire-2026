const express = require("express");
const router = express.Router();
const { getAdminOverview, getWorkerOverview } = require("../controllers/dashboardController");

router.get("/admin/overview", getAdminOverview);
router.get("/worker/:userId", getWorkerOverview);

module.exports = router;
