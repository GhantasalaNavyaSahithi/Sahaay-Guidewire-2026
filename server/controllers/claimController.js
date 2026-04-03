const {
  addFeed,
  createClaim,
  getClaim,
  listClaimsByPolicy,
  listClaimsByUser,
  updateClaim
} = require("../data/store");

const triggerClaim = (req, res) => {
  const type = req.params.type;
  const payoutMap = {
    rain: 150,
    waterlogging: 180,
    heat: 120,
    route: 110,
    downtime: 100
  };

  const payoutAmount = payoutMap[type] || 100;
  const claim = createClaim({
    userId: req.query.userId || req.body?.userId || "demo-user",
    policyId: req.query.policyId || req.body?.policyId || "demo-policy",
    type,
    payoutAmount,
    source: "manual-demo",
    autoTriggered: true,
    verification: {
      approved: true,
      confidence: 0.84,
      reasons: ["manual demo trigger"]
    },
    status: "Approved"
  });

  addFeed({
    kind: "claim",
    title: `${type} claim approved`,
    description: `Manual demo trigger approved ₹${payoutAmount}.`,
    severity: "medium",
    source: "manual-demo",
    userId: claim.userId,
    policyId: claim.policyId,
    claimId: claim.id
  });

  return res.json({
    message: `Claim triggered due to ${type} ✅`,
    payout: payoutAmount,
    claim
  });
};

const listClaims = (req, res) => {
  return res.json({ claims: listClaimsByUser(req.params.userId) });
};

const listClaimsForPolicy = (req, res) => {
  return res.json({ claims: listClaimsByPolicy(req.params.policyId) });
};

const claimStatus = (req, res) => {
  const claim = getClaim(req.params.claimId);
  if (!claim) {
    return res.status(404).json({ message: "Claim not found" });
  }

  return res.json({ claim });
};

const updateClaimStatus = (req, res) => {
  const claim = updateClaim(req.params.claimId, req.body || {});
  if (!claim) {
    return res.status(404).json({ message: "Claim not found" });
  }

  return res.json({ message: "Claim updated", claim });
};

module.exports = {
  claimStatus,
  listClaims,
  listClaimsForPolicy,
  triggerClaim,
  updateClaimStatus
};