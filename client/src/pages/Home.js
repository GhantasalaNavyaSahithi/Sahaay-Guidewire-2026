import React from "react";

function Home({ onGetStarted }) {
	const featureCards = [
		{
			title: "Zero Friction",
			description: "Set it once. Sahaay keeps working without extra steps or forms.",
			icon: "⚡"
		},
		{
			title: "Transparent Premium",
			description: "Premium changes are visible, simple, and tied to your area risk.",
			icon: "📊"
		},
		{
			title: "Instant Relief",
			description: "When disruption hits, payout decisions are ready immediately.",
			icon: "🛡️"
		}
	];

	const coverageSteps = [
		{
			label: "Register",
			description: "Capture the worker profile, working pattern, and coverage intent."
		},
		{
			label: "Price",
			description: "Use zone, weather, income, and device trust to calculate a weekly premium."
		},
		{
			label: "Protect",
			description: "Watch live disruption feeds and issue claims without extra user action."
		}
	];

	return (
		<main className="page page-home">
			<section className="hero-card home-hero">
				<div className="hero-layout">
					<div className="hero-copy">
						<p className="hero-badge">Sahaay Protects the Worker</p>
						<h1>Income protection that reacts before the loss does.</h1>
						<p className="tagline">Protecting your Roji-Roti, silently.</p>
						<p className="subtitle">
							Weather shocks, route disruption, platform downtime, and heat stress are all handled in one flow: register once, price dynamically, and claim without friction.
						</p>
						<div className="hero-actions">
							<button className="btn btn-primary" onClick={onGetStarted}>
								Get Started
							</button>
							<p className="hero-note">No forms. No stress. You stay focused on deliveries.</p>
						</div>
						<div className="stats-row">
							<div className="stat-chip">
								<strong>5 live triggers</strong>
								<span>Weather, route, heat, downtime, waterlogging</span>
							</div>
							<div className="stat-chip">
								<strong>Zero-touch claims</strong>
								<span>Auto verification and instant payout decisions</span>
							</div>
							<div className="stat-chip">
								<strong>Live dynamic pricing</strong>
								<span>Area, weather, income, hours, and device trust</span>
							</div>
						</div>
					</div>

					<aside className="hero-sidecard">
						<div className="hero-sidecard-top">
							<div>
								<p className="sidecard-label">Live protection orbit</p>
								<h3>Always watching your shift.</h3>
							</div>
							<p className="status-pill">Auto-active</p>
						</div>

						<div className="coverage-orbit">
							<div className="orbit-ring orbit-ring-one" />
							<div className="orbit-ring orbit-ring-two" />
							<div className="orbit-core">
								<span>24/7</span>
								<strong>Coverage mode</strong>
							</div>
						</div>

						<div className="live-metrics">
							<div className="metric-chip">
								<p className="metric-value">₹25</p>
								<p className="metric-label">Base weekly premium</p>
							</div>
							<div className="metric-chip">
								<p className="metric-value">3-5</p>
								<p className="metric-label">Automated disruption signals</p>
							</div>
							<div className="metric-chip">
								<p className="metric-value">&lt; 2m</p>
								<p className="metric-label">Demo-ready claim journey</p>
							</div>
						</div>
					</aside>
				</div>
			</section>

			<section className="feature-band">
				{featureCards.map((card) => (
					<article className="trust-card feature-card" key={card.title}>
						<div className="feature-icon">{card.icon}</div>
						<h3>{card.title}</h3>
						<p>{card.description}</p>
					</article>
				))}
			</section>

			<section className="trust-grid trust-grid-wide">
				{coverageSteps.map((step, index) => (
					<article className="trust-card story-step" key={step.label}>
						<span>{index + 1}</span>
						<h3>{step.label}</h3>
						<p>{step.description}</p>
					</article>
				))}
			</section>
		</main>
	);
}

export default Home;
