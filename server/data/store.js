const { randomUUID } = require("crypto");
const seed = require("./mockData.json");

const state = {
  users: Array.isArray(seed.users) ? [...seed.users] : [],
  policies: Array.isArray(seed.policies) ? [...seed.policies] : [],
  claims: Array.isArray(seed.claims) ? [...seed.claims] : [],
  feed: Array.isArray(seed.feed) ? [...seed.feed] : [],
  system: {
    lastScanAt: null,
    scanCount: 0,
    activeTriggers: []
  }
};

const createId = (prefix) => `${prefix}_${randomUUID().slice(0, 8)}`;
const now = () => new Date().toISOString();
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const trim = (items, limit = 50) => {
  if (items.length > limit) {
    items.splice(limit);
  }
};

const addFeed = (entry) => {
  const feedEntry = {
    id: createId("feed"),
    createdAt: now(),
    ...entry
  };

  state.feed.unshift(feedEntry);
  trim(state.feed, 40);
  return feedEntry;
};

const createUser = (payload) => {
  const user = {
    id: createId("user"),
    createdAt: now(),
    ...payload
  };

  state.users.unshift(user);
  trim(state.users, 30);
  return user;
};

const updateUser = (userId, updates) => {
  const index = state.users.findIndex((user) => user.id === userId);
  if (index === -1) return null;

  state.users[index] = {
    ...state.users[index],
    ...updates,
    updatedAt: now()
  };

  return state.users[index];
};

const getUser = (userId) => state.users.find((user) => user.id === userId) || null;
const findUserByPhone = (phone) => state.users.find((user) => user.phone === phone) || null;
const findUserByEmail = (email) => state.users.find((user) => user.email === email) || null;

const upsertPolicy = (payload) => {
  const existingIndex = state.policies.findIndex((policy) => policy.userId === payload.userId && policy.status !== "Cancelled");
  const policy = {
    ...(existingIndex >= 0 ? state.policies[existingIndex] : {}),
    id: existingIndex >= 0 ? state.policies[existingIndex].id : createId("policy"),
    createdAt: existingIndex >= 0 ? state.policies[existingIndex].createdAt : now(),
    updatedAt: now(),
    status: payload.status || (existingIndex >= 0 ? state.policies[existingIndex].status : "Active"),
    ...payload
  };

  if (existingIndex >= 0) {
    state.policies[existingIndex] = policy;
  } else {
    state.policies.unshift(policy);
  }

  trim(state.policies, 40);
  return policy;
};

const updatePolicy = (policyId, updates) => {
  const index = state.policies.findIndex((policy) => policy.id === policyId);
  if (index === -1) return null;

  state.policies[index] = {
    ...state.policies[index],
    ...updates,
    updatedAt: now()
  };

  return state.policies[index];
};

const getPolicy = (policyId) => state.policies.find((policy) => policy.id === policyId) || null;
const getPolicyByUser = (userId) => state.policies.find((policy) => policy.userId === userId && policy.status !== "Cancelled") || null;
const listPoliciesByUser = (userId) => state.policies.filter((policy) => policy.userId === userId);

const cancelPolicy = (policyId) => updatePolicy(policyId, { status: "Cancelled", cancelledAt: now() });

const createClaim = (payload) => {
  const claim = {
    id: createId("claim"),
    createdAt: now(),
    status: "Approved",
    verifiedAt: now(),
    autoTriggered: true,
    ...payload
  };

  state.claims.unshift(claim);
  trim(state.claims, 80);
  return claim;
};

const updateClaim = (claimId, updates) => {
  const index = state.claims.findIndex((claim) => claim.id === claimId);
  if (index === -1) return null;

  state.claims[index] = {
    ...state.claims[index],
    ...updates,
    updatedAt: now()
  };

  return state.claims[index];
};

const getClaim = (claimId) => state.claims.find((claim) => claim.id === claimId) || null;
const listClaimsByUser = (userId) => state.claims.filter((claim) => claim.userId === userId);
const listClaimsByPolicy = (policyId) => state.claims.filter((claim) => claim.policyId === policyId);

const findRecentClaimByType = (policyId, type, withinHours = 6) => {
  const threshold = Date.now() - withinHours * 60 * 60 * 1000;
  return state.claims.find((claim) => {
    if (claim.policyId !== policyId || claim.type !== type) return false;
    const createdAt = new Date(claim.createdAt).getTime();
    return createdAt >= threshold;
  }) || null;
};

const setSystemStatus = (updates) => {
  state.system = {
    ...state.system,
    ...updates
  };
  return state.system;
};

module.exports = {
  addFeed,
  cancelPolicy,
  clamp,
  createClaim,
  createId,
  createUser,
  findRecentClaimByType,
  findUserByEmail,
  findUserByPhone,
  getClaim,
  getPolicy,
  getPolicyByUser,
  getUser,
  listClaimsByPolicy,
  listClaimsByUser,
  listPoliciesByUser,
  setSystemStatus,
  state,
  updateClaim,
  updatePolicy,
  updateUser,
  upsertPolicy
};