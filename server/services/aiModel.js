const scoreClaimRisk = ({ policy, user, trigger, weatherSnapshot, recentClaims = [] }) => {
	let confidence = 0.72;
	const reasons = [];

	if (!policy || policy.status !== "Active") {
		confidence -= 0.45;
		reasons.push("policy inactive");
	}

	if (user?.area === "flood" && (trigger.type === "rain" || trigger.type === "waterlogging")) {
		confidence += 0.08;
		reasons.push("hyper-local waterlogging match");
	}

	if (user?.area === "heat" && trigger.type === "heat") {
		confidence += 0.08;
		reasons.push("heat stress match");
	}

	if ((weatherSnapshot?.precipitationProbability || 0) >= 60 && (trigger.type === "rain" || trigger.type === "waterlogging")) {
		confidence += 0.08;
		reasons.push("weather forecast corroborated");
	}

	if ((weatherSnapshot?.temperature || 0) >= 36 && trigger.type === "heat") {
		confidence += 0.06;
		reasons.push("temperature corroborated");
	}

	if (recentClaims.length >= 2) {
		confidence -= 0.12;
		reasons.push("repeat claim pattern");
	}

	if ((user?.deviceReliability || "medium") === "low") {
		confidence -= 0.05;
		reasons.push("low device trust");
	}

	confidence = Math.max(0, Math.min(0.98, confidence));

	return {
		approved: confidence >= 0.68,
		confidence,
		reasons,
		fraudFlag: confidence < 0.5
	};
};

const evaluateCoverageSignal = ({ user, weatherSnapshot }) => {
	const areaSignal = {
		safe: 0.18,
		heat: 0.48,
		flood: 0.78,
		coastal: 0.68
	}[user?.area || "safe"] || 0.18;

	const weatherSignal = Math.max(
		Number(weatherSnapshot?.precipitationProbability || 0) / 100,
		Number(weatherSnapshot?.temperature || 30) >= 36 ? 0.58 : 0.12
	);

	const riskScore = Math.max(areaSignal, weatherSignal);
	const recommendedCoverageHours = riskScore >= 0.7 ? 20 : riskScore >= 0.45 ? 24 : 28;

	return {
		riskScore,
		recommendedCoverageHours,
		summary:
			riskScore >= 0.7
				? "High impact disruption zone"
				: riskScore >= 0.45
					? "Moderate risk corridor"
					: "Stable delivery corridor",
		model: "mock-ml-risk-v1"
	};
};

module.exports = {
	evaluateCoverageSignal,
	scoreClaimRisk
};
