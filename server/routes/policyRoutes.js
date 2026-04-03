const express = require("express");
const router = express.Router();
const {
	activatePolicy,
	deactivatePolicy,
	getPolicyDetails,
	listPolicies,
	refreshPolicy
} = require("../controllers/policyController");

router.post("/activate", activatePolicy);
router.get("/user/:userId", listPolicies);
router.get("/:policyId", getPolicyDetails);
router.patch("/:policyId", refreshPolicy);
router.delete("/:policyId", deactivatePolicy);

module.exports = router;