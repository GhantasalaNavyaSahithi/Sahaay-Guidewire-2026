import React, { useEffect, useState } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from "recharts";
import API from "../services/api";

const claimContent = {
	rain: {
		title: "Heavy Rain Disruption",
		line: "Claim auto-approved",
		payoutLine: "₹150 credited instantly",
		icon: "🌧️",
		notification: "Rain trigger verified by live weather signal"
	},
	heat: {
		title: "Extreme Heat Alert",
		line: "Claim auto-approved",
		payoutLine: "₹120 credited instantly",
		icon: "🔥",
		notification: "Heat trigger verified by forecast signal"
	},
	route: {
		title: "Route Blockage Detected",
		line: "Claim auto-approved",
		payoutLine: "₹110 credited instantly",
		icon: "🛣️",
		notification: "Route trigger verified by scan logic"
	},
	downtime: {
		title: "Platform Downtime",
		line: "Claim auto-approved",
		payoutLine: "₹100 credited instantly",
		icon: "🚫",
		notification: "Platform trigger verified by public status feed"
	},
	waterlogging: {
		title: "Waterlogging Risk",
		line: "Claim auto-approved",
		payoutLine: "₹180 credited instantly",
		icon: "💧",
		notification: "Waterlogging trigger verified by rain and flood data"
	}
};

const triggerCatalog = [
	{ type: "rain", label: "Rain Alert", source: "open-meteo", payout: 150, icon: "🌧️" },
	{ type: "waterlogging", label: "Waterlogging Risk", source: "open-meteo", payout: 180, icon: "💧" },
	{ type: "heat", label: "Heatwave Alert", source: "open-meteo", payout: 120, icon: "🔥" },
	{ type: "route", label: "Route Blockage", source: "mock-route-scan", payout: 110, icon: "🛣️" },
	{ type: "downtime", label: "Platform Downtime", source: "GitHub Status / mock fallback", payout: 100, icon: "🚫" }
];

const chartData = [
	{ day: "Mon", normal: 760, protected: 780 },
	{ day: "Tue", normal: 780, protected: 800 },
	{ day: "Wed", normal: 430, protected: 740 },
	{ day: "Thu", normal: 650, protected: 730 },
	{ day: "Fri", normal: 790, protected: 810 },
	{ day: "Sat", normal: 720, protected: 840 },
	{ day: "Sun", normal: 700, protected: 720 }
];

const zeroTouchSteps = [
	{ key: "weather", label: "Detect disruption" },
	{ key: "location", label: "Cross-check signal" },
	{ key: "fraud", label: "Verify claim trust" }
];

const riskMeta = {
	safe: { emoji: "🟢", label: "Safe Zone", multiplier: 1.0 },
	heat: { emoji: "🔥", label: "Heat Zone", multiplier: 1.4 },
	flood: { emoji: "💧", label: "Flood Zone", multiplier: 1.3 },
	coastal: { emoji: "🌪️", label: "Coastal Zone", multiplier: 1.5 }
};

const buildProfileData = (user = {}) => ({
	area: user.area || "safe",
	occupation: user.occupation || "delivery",
	weeklyIncome: user.weeklyIncome || 8000,
	weeklyHours: user.weeklyHours || 40,
	vehicleAge: user.vehicleAge || 2,
	deviceReliability: user.deviceReliability || "high",
	coverageHours: user.coverageHours || 24
});

const formatScanTime = (timestamp) => {
	if (!timestamp) return "Waiting for first scan";
	return new Date(timestamp).toLocaleString();
};

function DashboardPage({ user, onRestart, onLogout }) {
	const [quote, setQuote] = useState(null);
	const [policy, setPolicy] = useState(null);
	const [loading, setLoading] = useState(true);
	const [feeds, setFeeds] = useState([]);
	const [autoClaims, setAutoClaims] = useState([]);
	const [systemStatus, setSystemStatus] = useState({ scanCount: 0, lastScanAt: null, activeTriggers: [] });
	const [processingClaim, setProcessingClaim] = useState(false);
	const [scanning, setScanning] = useState(false);
	const [result, setResult] = useState(null);
	const [aiChecks, setAiChecks] = useState({ weather: false, location: false, fraud: false });
	const [alerts, setAlerts] = useState(["Protection active", "Monitoring your zone"]);
	const [trustScore, setTrustScore] = useState(92);
	const [message, setMessage] = useState("");

	const loadDashboard = async ({ silent = false } = {}) => {
		if (!silent) {
			setLoading(true);
		}

		try {
			const profileData = buildProfileData(user);

			const premiumResponse = await API.get(`/premium/${profileData.area}`, { params: profileData });
			setQuote(premiumResponse.data || { finalPremium: 25, aiSignal: { riskScore: 0.45, summary: "Moderate risk" } });

			const policyResponse = await API.get(`/policy/user/${user.id || "demo-user"}`);
			setPolicy(policyResponse.data?.policies?.[0] || null);

			const feedResponse = await API.get("/triggers/feed");
			setFeeds((feedResponse.data?.feed || []).slice(0, 8));
			setSystemStatus(feedResponse.data?.status || { scanCount: 0, lastScanAt: null, activeTriggers: [] });

			const claimsResponse = await API.get(`/claim/user/${user.id || "demo-user"}`);
			setAutoClaims((claimsResponse.data?.claims || []).slice(0, 5));
		} catch (error) {
			console.error("Dashboard load error:", error);
			setQuote({ finalPremium: 25, aiSignal: { riskScore: 0.45, summary: "Moderate risk", recommendedCoverageHours: 24, model: "mock-ml-risk-v1" } });
			setFeeds([]);
			setAutoClaims([]);
		} finally {
			if (!silent) {
				setLoading(false);
			}
		}
	};

	useEffect(() => {
		loadDashboard();
		const interval = setInterval(() => loadDashboard({ silent: true }), 12000);
		return () => clearInterval(interval);
	}, [user?.area, user?.id]);

	const activePolicy = policy || {};
	const currentZone = riskMeta[user.area] || riskMeta.safe;
	const premiumAdjustments = quote?.factors || [];
	const isLiveActive = (systemStatus.scanCount || 0) > 0;

	const runAutomationScan = async () => {
		setScanning(true);
		setMessage("");

		try {
			const response = await API.get("/triggers/scan");
			const claimsGenerated = response.data?.claims?.length || 0;
			setMessage(claimsGenerated ? `${claimsGenerated} automated trigger${claimsGenerated === 1 ? "" : "s"} fired.` : "Scan completed. No disruption detected this cycle.");
			await loadDashboard({ silent: true });
		} catch (error) {
			console.error("Automation scan error:", error);
			setMessage("Automation scan could not be completed right now.");
		} finally {
			setScanning(false);
		}
	};

	const handleManualTrigger = async (type) => {
		setProcessingClaim(true);
		setResult(null);
		setAiChecks({ weather: false, location: false, fraud: false });
		setAlerts(["Running zero-touch claim checks", "Verifying disruption signal"]);

		window.setTimeout(() => {
			setAiChecks({ weather: true, location: true, fraud: false });
		}, 260);

		window.setTimeout(() => {
			setAiChecks({ weather: true, location: true, fraud: true });
		}, 620);

		try {
			const response = await API.get(`/claim/trigger/${type}`);
			const fallbackTrigger = triggerCatalog.find((trigger) => trigger.type === type);
			const payout = response.data?.payout ?? fallbackTrigger?.payout ?? 0;
			setResult({ type, payout });
			setTrustScore((current) => (type === "downtime" ? Math.max(88, current - 2) : Math.min(96, current + 1)));
			setAlerts([claimContent[type]?.notification || "Trigger processed", "Payout queued with no worker action"]);
			await loadDashboard({ silent: true });
		} catch (error) {
			console.error("Trigger error:", error);
			setResult({ type, payout: triggerCatalog.find((trigger) => trigger.type === type)?.payout || 0 });
			setAlerts(["Demo trigger processed locally", "Claim flow stayed zero-touch"]);
		} finally {
			setProcessingClaim(false);
		}
	};

	const refreshPolicy = async () => {
		if (!activePolicy.id) return;

		try {
			setMessage("Repricing policy with the latest live signals...");
			const response = await API.patch(`/policy/${activePolicy.id}`, buildProfileData(user));
			setPolicy(response.data?.policy || null);
			setQuote(response.data?.premiumQuote || quote);
			setMessage("Policy refreshed and repriced.");
			await loadDashboard({ silent: true });
		} catch (error) {
			console.error("Policy refresh error:", error);
			setMessage("Policy refresh failed. The live policy is still active.");
		}
	};

	const claimResult = result ? claimContent[result.type] : null;

	return (
		<main className="page page-dashboard">
			<header className="top-header card">
				<div>
					<p className="brand-mark">Sahaay Protects the Worker</p>
					<p className="helper-text">Live zone monitoring, dynamic pricing, and zero-touch claims.</p>
				</div>
				<div className="header-right">
					<div className="header-status">
						<span className={`status-pill ${isLiveActive ? "status-active" : ""}`}>{isLiveActive ? "Automation live" : "Starting automation"}</span>
						<p className="helper-text">Last scan: {formatScanTime(systemStatus.lastScanAt)}</p>
					</div>
					<p>{user.name || "Worker"}</p>
					<button className="logout-btn" onClick={onLogout} type="button">
						Logout
					</button>
				</div>
			</header>

			<section className="dashboard-grid">
				<article className="card dashboard-hero" style={{ gridColumn: "1 / span 2" }}>
					<div className="dashboard-hero-copy">
						<p className="hero-badge">{currentZone.emoji} {currentZone.label}</p>
						<h2>Welcome, {user.name || "Worker"}. Your protection is already on.</h2>
						<p className="subtitle">This policy watches weather, route disruption, and platform downtime in the background, then prices and pays automatically when risk is confirmed.</p>
						<div className="metric-row">
							<div className="metric-card">
								<strong>₹{quote?.finalPremium || 25}</strong>
								<span>Weekly premium</span>
							</div>
							<div className="metric-card">
								<strong>{Math.round((quote?.aiSignal?.riskScore || 0.45) * 100)}%</strong>
								<span>Risk score</span>
							</div>
							<div className="metric-card">
								<strong>{autoClaims.length}</strong>
								<span>Auto claims</span>
							</div>
						</div>
						<div className="dashboard-actions">
							<button className="btn btn-primary" onClick={runAutomationScan} disabled={scanning} type="button">
								{scanning ? "Scanning..." : "Run automation scan"}
							</button>
							<button className="btn btn-secondary" onClick={refreshPolicy} type="button" disabled={!activePolicy.id}>
								Reprice policy
							</button>
							<button className="btn btn-secondary" onClick={onRestart} type="button">
								Update profile
							</button>
						</div>
						{message && <p className="helper-text notice-line">{message}</p>}
						<div className="trust-chip-row">
							<span className="chip">Scan count: {systemStatus.scanCount || 0}</span>
							<span className="chip">Active triggers: {(systemStatus.activeTriggers || []).length}</span>
							<span className="chip">Trust score: {trustScore}%</span>
						</div>
					</div>

					<div className="dashboard-hero-panel">
						<div className="coverage-orbit coverage-orbit-small">
							<div className="orbit-ring orbit-ring-one" />
							<div className="orbit-ring orbit-ring-two" />
							<div className="orbit-core">
								<span>{activePolicy.status || "Active"}</span>
								<strong>Policy status</strong>
							</div>
						</div>
						<div className="hero-side-summary">
							<p><strong>Coverage:</strong> {user.coverageHours || 24} hours daily</p>
							<p><strong>Zone source:</strong> {quote?.weatherSnapshot?.source || "live / mock"}</p>
							<p><strong>Model:</strong> {quote?.aiSignal?.model || "mock-ml-risk-v1"}</p>
							<p><strong>Policy window:</strong> 7-day rolling protection</p>
						</div>
					</div>
				</article>

				<article className="card trust-card-panel">
					<h3>AI Risk Assessment</h3>
					{loading ? (
						<p>Calculating personalized risk...</p>
					) : quote?.aiSignal ? (
						<>
							<div className="score-track">
								<div className="score-fill" style={{ width: `${(quote.aiSignal.riskScore || 0.45) * 100}%` }} />
							</div>
							<p className="helper-text">Risk level: <strong>{quote.aiSignal.summary}</strong></p>
							<p className="helper-text">Recommended coverage: <strong>{quote.aiSignal.recommendedCoverageHours || 24}h daily</strong></p>
							<p className="helper-text">Model: {quote.aiSignal.model}</p>
							<div className="step-list compact-step-list">
								{zeroTouchSteps.map((step) => (
									<div key={step.key} className={`step-pill ${aiChecks[step.key] ? "step-pill-active" : ""}`}>
										<span>{aiChecks[step.key] ? "✓" : "•"}</span>
										<p>{step.label}</p>
									</div>
								))}
							</div>
						</>
					) : null}
				</article>

				<article className="card premium-card">
					<h3>Your Personalized Premium</h3>
					<p className="helper-text">Dynamic pricing based on live risk signals and working profile.</p>
					{loading ? (
						<p>Calculating...</p>
					) : quote ? (
						<div className="premium-visual-list">
							<div className="premium-summary-line">
								<p><strong>Base Premium:</strong> ₹{quote.base || 25}/week</p>
								<span>Baseline policy pricing</span>
							</div>
							<div className="premium-summary-line">
								<p><strong>Risk Adjustment:</strong> {quote.adjustment >= 0 ? `+₹${quote.adjustment}` : `−₹${Math.abs(quote.adjustment)}`}</p>
								<span>{quote.adjustment > 0 ? "Higher risk zone multiplier" : "Safe zone discount"}</span>
							</div>
							<div className="premium-summary-line final-line">
								<p>Final weekly premium</p>
								<strong>₹{quote.finalPremium || 25}</strong>
							</div>
							<div className="premium-factor-list">
								{premiumAdjustments.slice(0, 4).map((factor) => (
									<div key={factor.label} className="premium-factor">
										<p>{factor.label}</p>
										<span>{factor.value}</span>
										<strong>{factor.delta >= 0 ? `+₹${factor.delta}` : `−₹${Math.abs(factor.delta)}`}</strong>
									</div>
								))}
							</div>
						</div>
					) : null}
				</article>

				<article className="card policy-card compact-card">
					<h3>Policy Management</h3>
					<p className="helper-text">Current policy is active and can be repriced at any time.</p>
					<div className="policy-summary-grid">
						<div>
							<span>Coverage type</span>
							<strong>{activePolicy.coverageType || "Zero-touch delivery protection"}</strong>
						</div>
						<div>
							<span>Status</span>
							<strong>{activePolicy.status || "Active"}</strong>
						</div>
						<div>
							<span>Weather source</span>
							<strong>{activePolicy.weatherSource || "open-meteo / mock"}</strong>
						</div>
						<div>
							<span>Coverage hours</span>
							<strong>{activePolicy.recommendedCoverageHours || user.coverageHours || 24}h</strong>
						</div>
					</div>
					<div className="status-pill-row">
						<span className={`status-pill status-${currentZone.label.toLowerCase().split(" ")[0]}`}>{currentZone.label}</span>
						<span className="status-pill">Auto claim enabled</span>
					</div>
				</article>

				<article className="card chart-card" style={{ gridColumn: "1 / span 2" }}>
					<div className="chart-head">
						<h3>Weekly Earnings Impact</h3>
						<p className="helper-text">Your protected earnings vs. disruption scenarios</p>
					</div>
					<div className="chart-wrap">
						<ResponsiveContainer width="100%" height={250}>
							<LineChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="#d7e6f0" />
								<XAxis dataKey="day" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Line type="monotone" dataKey="normal" stroke="#ff7d7d" strokeWidth={3} name="Without Sahaay" />
								<Line type="monotone" dataKey="protected" stroke="#43e97b" strokeWidth={3} name="With Sahaay" />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</article>

				<article className="card trigger-card-panel" style={{ gridColumn: "1 / span 2" }}>
					<div className="chart-head">
						<h3>Automation Triggers</h3>
						<p className="helper-text">Five trigger sources are wired into the demo: weather, route, and platform signals.</p>
					</div>
					<div className="trigger-grid">
						{triggerCatalog.map((trigger) => (
							<button key={trigger.type} type="button" className={`trigger-card ${trigger.type}`} onClick={() => handleManualTrigger(trigger.type)} disabled={processingClaim || scanning}>
								<span>{trigger.icon}</span>
								<strong>{trigger.label}</strong>
								<small>{trigger.source}</small>
								<b>₹{trigger.payout}</b>
							</button>
						))}
					</div>
				</article>

				<article className="card feed-card" style={{ gridColumn: "1 / span 2" }}>
					<h3>Live Automation Feed</h3>
					<p className="helper-text">Events detected and handled automatically.</p>
					{feeds.length > 0 ? (
						<div className="feed-list">
							{feeds.slice(0, 8).map((feed) => (
								<div key={feed.id} className={`feed-item severity-${feed.severity || "low"}`}>
									<p className="feed-title">{feed.title}</p>
									<p className="feed-description">{feed.description}</p>
									<p className="feed-meta">via {feed.source}</p>
								</div>
							))}
						</div>
					) : (
						<p className="helper-text">Monitoring your zone 24/7...</p>
					)}
				</article>

				<article className="card auto-claims-card" style={{ gridColumn: "1 / span 2" }}>
					<h3>Zero-Touch Claims</h3>
					<p className="helper-text">Claims are processed without the worker submitting a manual form.</p>
					<div className="zero-touch-ux">
						<div className="zero-touch-column">
							{zeroTouchSteps.map((step) => (
								<div key={step.key} className={`zero-touch-step ${aiChecks[step.key] ? "zero-touch-step-active" : ""}`}>
									<span>{aiChecks[step.key] ? "✓" : "•"}</span>
									<div>
										<strong>{step.label}</strong>
										<p>{step.key === "weather" ? "Weather and disruption signal accepted" : step.key === "location" ? "Context and zone cross-checked" : "Claim trust score validated"}</p>
									</div>
								</div>
							))}
						</div>
						<div className="zero-touch-claim-panel">
							{processingClaim ? (
								<p className="helper-text">Validating the claim pipeline...</p>
							) : claimResult ? (
								<div className="claim-success">
									<p className="claim-title">{claimResult.icon} {claimResult.title}</p>
									<p>{claimResult.line}</p>
									<strong>{claimResult.payoutLine}</strong>
									<p className="helper-text">Confidence: {trustScore}% | zero-touch payout path completed</p>
								</div>
							) : (
								<div className="claim-empty-state">
									<p className="helper-text">Trigger any scenario above to show the zero-touch claim experience.</p>
								</div>
							)}
							<div className="alerts-stack">
								{alerts.map((alert) => (
									<div key={alert} className="alert-chip">{alert}</div>
								))}
							</div>
						</div>
					</div>

					{autoClaims.length > 0 ? (
						<div className="claim-feed-list">
							{autoClaims.slice(0, 5).map((claim) => {
								const content = claimContent[claim.type] || claimContent.rain;
								return (
									<div key={claim.id} className="claim-success compact-claim">
										<p className="claim-title">{content.icon} {content.title}</p>
										<p>{content.line}</p>
										<strong>{content.payoutLine}</strong>
										<p className="helper-text">Confidence: {(claim.verification?.confidence * 100).toFixed(0)}% | via {claim.source}</p>
									</div>
								);
							})}
						</div>
					) : null}
				</article>
			</section>

			<div className="dashboard-actions">
				<button className="btn btn-secondary" onClick={onRestart} type="button">
					Update Profile
				</button>
				<button className="logout-btn mobile-logout" onClick={onLogout} type="button">
					Logout
				</button>
			</div>
		</main>
	);
}

export default DashboardPage;