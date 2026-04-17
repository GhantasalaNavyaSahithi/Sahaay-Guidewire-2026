const express = require("express");
const router = express.Router();
const {
	claimStatus,
	listClaims,
	listClaimsForPolicy,
	triggerClaim,
	updateClaimStatus
} = require("../controllers/claimController");

router.get("/trigger/:type", triggerClaim);
router.post("/trigger/:type", triggerClaim);
router.get("/user/:userId", listClaims);
router.get("/policy/:policyId", listClaimsForPolicy);
router.get("/:claimId", claimStatus);
router.patch("/:claimId", updateClaimStatus);

module.exports = router;