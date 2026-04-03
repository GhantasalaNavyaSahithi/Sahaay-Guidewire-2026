const { clamp } = require("../data/store");

const areaRiskMap = {
	safe: { premiumAdjustment: -2, riskScore: 0.18, coverageBoost: 2, label: "Historically dry lane" },
	heat: { premiumAdjustment: 2, riskScore: 0.48, coverageBoost: 1, label: "Heat-prone corridor" },
	flood: { premiumAdjustment: 4, riskScore: 0.78, coverageBoost: 0, label: "Waterlogging hotspot" },
	coastal: { premiumAdjustment: 3, riskScore: 0.68, coverageBoost: 0, label: "Coastal storm belt" }
};

const occupationRiskMap = {
	delivery: 2,
	rider: 2,
	courier: 1,
	logistics: 1,
	food: 1,
	generic: 0
};

const deviceRiskMap = {
	high: -1,
	medium: 0,
	low: 1
};

const deriveIncomeAdjustment = (weeklyIncome = 0) => {
	if (weeklyIncome < 4000) return -1;
	if (weeklyIncome < 7000) return 0;
	if (weeklyIncome < 10000) return 1;
	return 2;
};

const deriveHoursAdjustment = (weeklyHours = 0) => {
	if (weeklyHours <= 25) return -1;
	if (weeklyHours <= 45) return 0;
	if (weeklyHours <= 60) return 1;
	return 2;
};

const deriveVehicleAdjustment = (vehicleAge = 0) => {
	if (vehicleAge <= 2) return -1;
	if (vehicleAge <= 5) return 0;
	return 1;
};

const buildPremiumQuote = (profile = {}, weatherSignal = {}) => {
	const area = profile.area || "safe";
	const areaMeta = areaRiskMap[area] || areaRiskMap.safe;
	const occupationAdjustment = occupationRiskMap[profile.occupation] ?? 0;
	const deviceAdjustment = deviceRiskMap[profile.deviceReliability] ?? 0;
	const incomeAdjustment = deriveIncomeAdjustment(Number(profile.weeklyIncome) || 0);
	const hoursAdjustment = deriveHoursAdjustment(Number(profile.weeklyHours) || 0);
	const vehicleAdjustment = deriveVehicleAdjustment(Number(profile.vehicleAge) || 0);
	const weatherRiskScore = Number(weatherSignal.riskScore ?? areaMeta.riskScore);
	const weatherAdjustment = weatherRiskScore >= 0.7 ? 3 : weatherRiskScore >= 0.45 ? 2 : -1;
	const coverageBoost = clamp(areaMeta.coverageBoost + (weatherRiskScore < 0.35 ? 2 : weatherRiskScore < 0.55 ? 1 : 0), 0, 4);
	const base = 25;

	const adjustment =
		areaMeta.premiumAdjustment +
		occupationAdjustment +
		deviceAdjustment +
		incomeAdjustment +
		hoursAdjustment +
		vehicleAdjustment +
		weatherAdjustment;

	const finalPremium = Math.max(18, base + adjustment);
	const recommendedCoverageHours = clamp(Number(profile.coverageHours || 24) + coverageBoost, 24, 72);

	return {
		base,
		adjustment,
		finalPremium,
		recommendedCoverageHours,
		riskScore: Number(weatherSignal.riskScore ?? areaMeta.riskScore),
		factors: [
			{ label: "Area profile", value: areaMeta.label, delta: areaMeta.premiumAdjustment },
			{ label: "Occupation", value: profile.occupation || "delivery", delta: occupationAdjustment },
			{ label: "Weekly income", value: profile.weeklyIncome || 0, delta: incomeAdjustment },
			{ label: "Weekly hours", value: profile.weeklyHours || 0, delta: hoursAdjustment },
			{ label: "Vehicle age", value: profile.vehicleAge || 0, delta: vehicleAdjustment },
			{ label: "Device reliability", value: profile.deviceReliability || "medium", delta: deviceAdjustment },
			{ label: "Weather forecast", value: weatherSignal.summary || "Live forecast", delta: weatherAdjustment }
		]
	};
};

module.exports = {
	areaRiskMap,
	buildPremiumQuote
};
