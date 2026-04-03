const {
  addFeed,
  cancelPolicy,
  getPolicy,
  getPolicyByUser,
  listPoliciesByUser,
  updatePolicy,
  upsertPolicy
} = require("../data/store");
const { buildDynamicQuote } = require("../services/premiumService");

const activatePolicy = async (req, res) => {
  if (!req.body.userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const quote = await buildDynamicQuote(req.body);
  const policy = upsertPolicy({
    userId: req.body.userId,
    userName: req.body.userName,
    area: req.body.area || "safe",
    occupation: req.body.occupation || "delivery",
    status: "Active",
    coverageType: req.body.coverageType || "Zero-touch delivery protection",
    baseRate: quote.base,
    riskAdjustment: quote.adjustment,
    premiumAmount: quote.finalPremium,
    recommendedCoverageHours: quote.recommendedCoverageHours,
    autoClaimEnabled: true,
    weatherSource: quote.weatherSnapshot.source,
    riskScore: quote.riskScore,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  addFeed({
    kind: "policy",
    title: "Policy activated",
    description: `Policy activated for ${req.body.userName || req.body.userId}.`,
    severity: "low",
    source: "policy",
    userId: req.body.userId,
    policyId: policy.id
  });

  return res.json({
    message: "Policy Activated ✅",
    policy,
    premiumQuote: quote
  });
};

const listPolicies = (req, res) => {
  return res.json({ policies: listPoliciesByUser(req.params.userId) });
};

const getPolicyDetails = (req, res) => {
  const policy = getPolicy(req.params.policyId) || getPolicyByUser(req.params.policyId);
  if (!policy) {
    return res.status(404).json({ message: "Policy not found" });
  }

  return res.json({ policy });
};

const refreshPolicy = async (req, res) => {
  const policy = getPolicy(req.params.policyId);
  if (!policy) {
    return res.status(404).json({ message: "Policy not found" });
  }

  const quote = await buildDynamicQuote({
    area: req.body.area || policy.area,
    occupation: req.body.occupation || policy.occupation,
    weeklyIncome: req.body.weeklyIncome || policy.weeklyIncome,
    weeklyHours: req.body.weeklyHours || policy.weeklyHours,
    vehicleAge: req.body.vehicleAge || policy.vehicleAge,
    deviceReliability: req.body.deviceReliability || policy.deviceReliability,
    coverageHours: req.body.coverageHours || policy.recommendedCoverageHours
  });

  const updated = updatePolicy(policy.id, {
    ...req.body,
    area: req.body.area || policy.area,
    premiumAmount: quote.finalPremium,
    baseRate: quote.base,
    riskAdjustment: quote.adjustment,
    recommendedCoverageHours: quote.recommendedCoverageHours,
    riskScore: quote.riskScore,
    updatedFrom: "dashboard"
  });

  return res.json({ message: "Policy updated", policy: updated, premiumQuote: quote });
};

const deactivatePolicy = (req, res) => {
  const policy = cancelPolicy(req.params.policyId);
  if (!policy) {
    return res.status(404).json({ message: "Policy not found" });
  }

  addFeed({
    kind: "policy",
    title: "Policy cancelled",
    description: `Policy ${policy.id} cancelled from dashboard.`,
    severity: "medium",
    source: "policy",
    userId: policy.userId,
    policyId: policy.id
  });

  return res.json({ message: "Policy deactivated", policy });
};

module.exports = {
  activatePolicy,
  deactivatePolicy,
  getPolicyDetails,
  listPolicies,
  refreshPolicy
};