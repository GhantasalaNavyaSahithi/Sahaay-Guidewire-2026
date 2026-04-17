const {
  getClaim,
  getPolicy,
  getPolicyByUser,
  getUser,
  getWalletByUser,
  listClaimsByPolicy,
  listClaimsByUser,
  listPayoutsByUser,
  updateClaim
} = require("../data/store");
const { processClaimPipeline } = require("../services/claimPipelineService");

const triggerClaim = async (req, res) => {
  const type = req.params.type;
  const payoutMap = {
    rain: 150,
    waterlogging: 180,
    heat: 120,
    route: 110,
    downtime: 100
  };

  const payoutAmount = payoutMap[type] || 100;
  const userId = req.query.userId || req.body?.userId;
  const policyId = req.query.policyId || req.body?.policyId;
  const user = getUser(userId) || {
    id: "demo-user",
    name: "Demo Worker",
    area: req.body?.area || "flood",
    deviceReliability: req.body?.deviceReliability || "medium"
  };
  const policy = getPolicy(policyId) || getPolicyByUser(user.id) || {
    id: "demo-policy",
    userId: user.id,
    area: user.area,
    status: "Active"
  };

  const pipelineResult = await processClaimPipeline({
    user,
    policy,
    type,
    payoutAmount,
    source: "manual-demo",
    triggerLabel: `${type} demo trigger`.replace(/^./, (char) => char.toUpperCase()),
    triggerMessage: "manual disaster simulation",
    claimInput: {
      declaredReason: req.body?.declaredReason || req.query?.declaredReason || `Worker reports ${type} disruption`,
      reportedLocation: req.body?.reportedLocation || (req.query?.lat && req.query?.lng
        ? {
            latitude: Number(req.query.lat),
            longitude: Number(req.query.lng),
            accuracyMeters: Number(req.query.accuracy || 30)
          }
        : undefined),
      deviceMeta: req.body?.deviceMeta || {
        gpsProvider: req.query?.provider || "device-sensor",
        isMockLocationApp: req.query?.mockLocation === "1",
        speedKmph: Number(req.query?.speed || 35)
      }
    },
    modelVerification: {
      approved: true,
      confidence: 0.84,
      reasons: ["manual demo trigger"]
    }
  });

  return res.json({
    message: `Claim triggered due to ${type} ✅`,
    payout: pipelineResult.payout?.amount || 0,
    claim: pipelineResult.claim,
    antiCheat: pipelineResult.fraudCheck,
    wallet: getWalletByUser(user.id)
  });
};

const listClaims = (req, res) => {
  const userId = req.params.userId;
  return res.json({
    claims: listClaimsByUser(userId),
    payouts: listPayoutsByUser(userId),
    wallet: getWalletByUser(userId)
  });
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