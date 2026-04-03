const {
  addFeed,
  createUser,
  findUserByEmail,
  findUserByPhone,
  getPolicyByUser,
  getUser,
  listPoliciesByUser,
  updateUser,
  upsertPolicy
} = require("../data/store");
const { buildDynamicQuote } = require("../services/premiumService");

const validateRegistration = (payload) => {
  const errors = [];

  if (!payload.name || !payload.name.trim()) errors.push("Name is required.");
  if (!payload.phone || String(payload.phone).trim().length < 8) errors.push("Valid phone number is required.");
  if (!payload.area) errors.push("Area is required.");
  if (!payload.occupation) errors.push("Occupation is required.");
  if (!payload.weeklyIncome) errors.push("Weekly income is required.");

  return errors;
};

const registerUser = async (req, res) => {
  const validationErrors = validateRegistration(req.body || {});
  if (validationErrors.length) {
    return res.status(400).json({ message: "Validation failed", errors: validationErrors });
  }

  const phone = String(req.body.phone).trim();
  const email = req.body.email ? String(req.body.email).trim().toLowerCase() : "";

  if (findUserByPhone(phone) || (email && findUserByEmail(email))) {
    return res.status(409).json({ message: "Worker already registered" });
  }

  const profile = {
    name: req.body.name.trim(),
    phone,
    email,
    area: req.body.area,
    occupation: req.body.occupation,
    weeklyIncome: Number(req.body.weeklyIncome) || 0,
    weeklyHours: Number(req.body.weeklyHours) || 0,
    vehicleAge: Number(req.body.vehicleAge) || 0,
    coverageHours: Number(req.body.coverageHours) || 24,
    deviceReliability: req.body.deviceReliability || "medium"
  };

  const user = createUser({
    ...profile,
    authToken: `token_${Date.now().toString(36)}`
  });

  const premiumQuote = await buildDynamicQuote(profile);
  const policy = upsertPolicy({
    userId: user.id,
    userName: user.name,
    area: user.area,
    occupation: user.occupation,
    status: "Active",
    coverageType: "Zero-touch delivery protection",
    baseRate: premiumQuote.base,
    riskAdjustment: premiumQuote.adjustment,
    premiumAmount: premiumQuote.finalPremium,
    recommendedCoverageHours: premiumQuote.recommendedCoverageHours,
    autoClaimEnabled: true,
    weatherSource: premiumQuote.weatherSnapshot.source,
    riskScore: premiumQuote.riskScore,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  addFeed({
    kind: "policy",
    title: "Protection activated",
    description: `${user.name} enrolled with automatic claims and dynamic premium protection.`,
    severity: "low",
    source: "registration",
    userId: user.id,
    policyId: policy.id
  });

  return res.json({
    message: "Worker registered and policy activated ✅",
    user,
    policy,
    premiumQuote,
    claims: []
  });
};

const loginUser = (req, res) => {
  const { phone, email } = req.body || {};
  const existing = phone ? findUserByPhone(String(phone).trim()) : findUserByEmail(String(email || "").trim().toLowerCase());

  if (!existing) {
    return res.status(404).json({ message: "No worker profile found" });
  }

  const policy = getPolicyByUser(existing.id);

  return res.json({
    message: "Login successful",
    user: existing,
    policy,
    policies: listPoliciesByUser(existing.id)
  });
};

const getProfile = (req, res) => {
  const user = getUser(req.params.userId);
  if (!user) {
    return res.status(404).json({ message: "Profile not found" });
  }

  return res.json({ user, policy: getPolicyByUser(user.id) });
};

const updateProfile = (req, res) => {
  const user = updateUser(req.params.userId, req.body || {});

  if (!user) {
    return res.status(404).json({ message: "Profile not found" });
  }

  return res.json({ message: "Profile updated", user });
};

module.exports = { getProfile, loginUser, registerUser, updateProfile };