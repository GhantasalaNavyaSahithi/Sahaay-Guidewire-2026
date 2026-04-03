const store = require("../data/store");
const { addFeed, createClaim, findRecentClaimByType, getUser, setSystemStatus } = store;
const { evaluateCoverageSignal, scoreClaimRisk } = require("./aiModel");
const { detectWeatherTriggers, getWeatherSnapshot } = require("./weatherService");

let scannerRunning = false;
let scannerTimer = null;

const getPlatformStatus = async () => {
	try {
		const response = await fetch("https://www.githubstatus.com/api/v2/status.json");

		if (!response.ok) {
			throw new Error("Platform status unavailable");
		}

		const data = await response.json();
		const status = data?.status?.indicator || "none";

		return {
			source: "github-status",
			type: status === "none" ? "healthy" : "downtime",
			label: data?.status?.description || "Service health normal",
			severity: status === "none" ? "low" : "high"
		};
	} catch (error) {
		return {
			source: "mock-status",
			type: "healthy",
			label: "Platform health normal",
			severity: "low"
		};
	}
};

const buildAutoClaim = ({ user, policy, trigger, weatherSnapshot, source }) => {
	const recentClaims = store.listClaimsByPolicy(policy.id).filter((claim) => claim.type === trigger.type);
	const verification = scoreClaimRisk({ policy, user, trigger, weatherSnapshot, recentClaims });

	if (!verification.approved && !trigger.autoApproved) {
		return null;
	}

	const claim = createClaim({
		userId: user.id,
		policyId: policy.id,
		type: trigger.type,
		payoutAmount: trigger.payoutAmount,
		source,
		autoTriggered: true,
		verification,
		status: "Approved"
	});

	addFeed({
		kind: "claim",
		title: `${trigger.label} resolved automatically`,
		description: `${user.name || "Worker"} received ₹${trigger.payoutAmount} after ${trigger.message.toLowerCase()}.`,
		severity: trigger.severity,
		source: trigger.source,
		policyId: policy.id,
		userId: user.id,
		claimId: claim.id
	});

	return claim;
};

const scanPolicies = async () => {
	const generatedClaims = [];
	const activePolicies = store.state.policies.filter((policy) => policy.status === "Active");

	for (const policy of activePolicies) {
		const user = getUser(policy.userId);
		if (!user) continue;

		const weatherSnapshot = await getWeatherSnapshot(policy.area || user.area || "safe");
		const coverageSignal = evaluateCoverageSignal({ user, weatherSnapshot });
		const weatherTriggers = detectWeatherTriggers(weatherSnapshot);
		const platformStatus = await getPlatformStatus();

		const routeTrigger =
			weatherSnapshot.precipitationProbability >= 40 || coverageSignal.riskScore >= 0.45
				? {
						type: "route",
						label: "Route Blockage",
						source: "mock-route-scan",
						severity: "medium",
						payoutAmount: 110,
						message: "Route congestion and rain are slowing deliveries",
						autoApproved: true
					}
				: null;

		const platformTrigger =
			platformStatus.type === "downtime"
				? {
						type: "downtime",
						label: "Platform Downtime",
						source: platformStatus.source,
						severity: "high",
						payoutAmount: 100,
						message: "The platform health signal is degraded",
						autoApproved: true
					}
				: null;

		const candidateTriggers = [...weatherTriggers, routeTrigger, platformTrigger].filter(Boolean);

		for (const trigger of candidateTriggers) {
			if (findRecentClaimByType(policy.id, trigger.type, 4)) {
				continue;
			}

			const claim = buildAutoClaim({ user, policy, trigger, weatherSnapshot, source: trigger.source });
			if (claim) generatedClaims.push(claim);
		}

		addFeed({
			kind: "scan",
			title: `Automation scan completed for ${user.area || "safe"}`,
			description: `${candidateTriggers.length} trigger(s) evaluated with model confidence ${coverageSignal.riskScore.toFixed(2)}.`,
			severity: candidateTriggers.length ? "medium" : "low",
			source: weatherSnapshot.source,
			policyId: policy.id,
			userId: user.id
		});
	}

	setSystemStatus({
		lastScanAt: new Date().toISOString(),
		scanCount: store.state.system.scanCount + 1,
		activeTriggers: generatedClaims.map((claim) => claim.type)
	});

	return generatedClaims;
};

const startTriggerScheduler = (intervalMs = 20000) => {
	if (scannerRunning) return;

	scannerRunning = true;

	const runScan = async () => {
		try {
			await scanPolicies();
		} catch (error) {
			// keep scheduler alive even if one scan fails
		}
	};

	runScan();
	scannerTimer = setInterval(runScan, intervalMs);
};

const stopTriggerScheduler = () => {
	if (scannerTimer) {
		clearInterval(scannerTimer);
		scannerTimer = null;
	}
	scannerRunning = false;
};

const getAutomationFeed = () => store.state.feed;
const getAutomationStatus = () => store.state.system;

module.exports = {
	getAutomationFeed,
	getAutomationStatus,
	scanPolicies,
	startTriggerScheduler,
	stopTriggerScheduler
};
