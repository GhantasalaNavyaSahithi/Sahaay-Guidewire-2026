const store = require("../data/store");
const { areaRiskMap } = require("../utils/riskCalculator");
const { getWeatherSnapshot } = require("../services/weatherService");

const sum = (items, selector) => items.reduce((acc, item) => acc + Number(selector(item) || 0), 0);

const buildAreaRisk = () => {
  const claims = store.state.claims;
  const byArea = {};

  claims.forEach((claim) => {
    const policy = store.getPolicy(claim.policyId);
    const area = policy?.area || "safe";

    if (!byArea[area]) {
      byArea[area] = {
        area,
        claimsPaid: 0,
        flaggedClaims: 0,
        payoutTotal: 0,
        baseRisk: areaRiskMap[area]?.riskScore || 0.2
      };
    }

    if (claim.status === "Approved") {
      byArea[area].claimsPaid += 1;
      byArea[area].payoutTotal += Number(claim.payoutAmount || 0);
    }

    if (claim.status !== "Approved" || claim.verification?.fraudFlag) {
      byArea[area].flaggedClaims += 1;
    }
  });

  return Object.values(byArea)
    .map((entry) => {
      const volatility = entry.claimsPaid > 0 ? Math.min(0.95, entry.baseRisk + entry.claimsPaid * 0.03) : entry.baseRisk;
      return {
        ...entry,
        volatilityScore: Number(volatility.toFixed(2))
      };
    })
    .sort((a, b) => b.volatilityScore - a.volatilityScore);
};

const buildDisruptionForecast = async () => {
  const areas = Object.keys(areaRiskMap);
  const forecasts = await Promise.all(
    areas.map(async (area) => {
      const weather = await getWeatherSnapshot(area);
      const weatherSignal = Math.max(Number(weather.precipitationProbability || 0) / 100, Number(weather.temperature || 0) >= 36 ? 0.6 : 0.1);
      const baseRisk = Number(areaRiskMap[area]?.riskScore || 0.2);
      const predictedDisruption = Math.min(0.97, Number((baseRisk * 0.55 + weatherSignal * 0.45).toFixed(2)));

      return {
        area,
        predictedDisruption,
        expectedClaimVolume: Math.max(1, Math.round(predictedDisruption * 10)),
        weatherSummary: weather.summary,
        weatherSource: weather.source
      };
    })
  );

  return forecasts.sort((a, b) => b.predictedDisruption - a.predictedDisruption);
};

const getAdminOverview = async (req, res) => {
  const claims = store.state.claims;
  const approvedClaims = claims.filter((claim) => claim.status === "Approved");
  const flaggedClaims = claims.filter((claim) => claim.status !== "Approved" || claim.verification?.fraudFlag);
  const payouts = store.listPayouts();
  const areaRisk = buildAreaRisk();
  const disruptionForecast = await buildDisruptionForecast();

  return res.json({
    summary: {
      workersEnrolled: store.state.users.length,
      activePolicies: store.state.policies.filter((policy) => policy.status === "Active").length,
      claimsPaid: approvedClaims.length,
      claimsFlagged: flaggedClaims.length,
      payoutTotal: sum(payouts, (payout) => payout.amount),
      avgPayout: approvedClaims.length ? Number((sum(approvedClaims, (claim) => claim.payoutAmount) / approvedClaims.length).toFixed(2)) : 0,
      automationScans: Number(store.state.system.scanCount || 0)
    },
    areaRisk,
    disruptionForecast,
    latestFeed: store.state.feed.slice(0, 12),
    latestPayouts: payouts.slice(0, 10)
  });
};

const getWorkerOverview = async (req, res) => {
  const userId = req.params.userId;
  const user = store.getUser(userId);

  if (!user) {
    return res.status(404).json({ message: "Worker not found" });
  }

  const policy = store.getPolicyByUser(userId);
  const claims = store.listClaimsByUser(userId);
  const payouts = store.listPayoutsByUser(userId);
  const wallet = store.getWalletByUser(userId);
  const weather = await getWeatherSnapshot(policy?.area || user.area || "safe");

  return res.json({
    user,
    policy,
    weatherAlert: {
      area: policy?.area || user.area || "safe",
      summary: weather.summary,
      precipitationProbability: weather.precipitationProbability,
      temperature: weather.temperature,
      source: weather.source
    },
    earningsProtection: {
      totalClaimed: sum(claims.filter((claim) => claim.status === "Approved"), (claim) => claim.payoutAmount),
      weeklyCoverage: `₹${policy?.premiumAmount || 25}/week`,
      claimsPaidCount: claims.filter((claim) => claim.status === "Approved").length,
      claimsFlaggedCount: claims.filter((claim) => claim.status !== "Approved").length
    },
    wallet,
    claims: claims.slice(0, 10),
    payouts: payouts.slice(0, 10),
    feed: store.state.feed.filter((item) => item.userId === userId).slice(0, 8)
  });
};

module.exports = {
  getAdminOverview,
  getWorkerOverview
};
