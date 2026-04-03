import React, { useState } from "react";
import API from "../services/api";

function RegisterPage({ onBack, onRegistered }) {
	const [profile, setProfile] = useState({
		name: "",
		phone: "",
		email: "",
		area: "safe",
		occupation: "delivery",
		weeklyIncome: 8000,
		weeklyHours: 40,
		vehicleAge: 2,
		deviceReliability: "high",
		coverageHours: 24
	});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (field, value) => {
		setProfile(prev => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!profile.name.trim()) {
			setError("Please enter your name.");
			return;
		}

		if (!String(profile.phone || "").trim() || String(profile.phone || "").trim().length < 8) {
			setError("Please enter a valid phone number (minimum 8 digits).");
			return;
		}

		if (!profile.area || !profile.occupation) {
			setError("Please select your occupation and delivery zone.");
			return;
		}

		if (!Number(profile.weeklyIncome) || Number(profile.weeklyIncome) <= 0) {
			setError("Please enter a valid weekly income.");
			return;
		}

		try {
			setSaving(true);
			setError("");
			const response = await API.post("/users/register", profile);
			const userData = response.data.user || response.data || profile;
			onRegistered(userData);
		} catch (requestError) {
			console.error("Registration error:", requestError);

			if (!requestError?.response) {
				setError("Backend API is not reachable. Start the server with: npm --prefix server start");
			} else {
				setError(requestError?.response?.data?.errors?.[0] || requestError?.response?.data?.message || "Registration failed. Please check the details and try again.");
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<main className="page page-register">
			<section className="form-card register-layout">
				<div className="register-copy">
					<p className="hero-badge">Step 1 of 3</p>
					<h2>Create your protection profile</h2>
					<p className="subtitle">Quick setup. AI calculates your personalized premium based on your work pattern, risk zone, and the strength of the public weather signal.</p>

					<div className="policy-highlight">
						<p className="policy-highlight-label">What the system uses</p>
						<ul className="step-list">
							<li>Identity and contact details for activation</li>
							<li>Work zone, hours, income, and vehicle condition</li>
							<li>Device trust and live weather data for pricing</li>
						</ul>
					</div>
				</div>

				<div className="register-form-wrap">
					<form onSubmit={handleSubmit} className="register-form">
						<div className="field-grid">
							<div className="field-block">
								<label htmlFor="name">Your Name</label>
								<input id="name" type="text" value={profile.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter your name" />
							</div>
							<div className="field-block">
								<label htmlFor="phone">Phone Number</label>
								<input id="phone" type="tel" value={profile.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="Enter mobile number" />
							</div>
						</div>

						<div className="field-block">
							<label htmlFor="email">Email Address</label>
							<input id="email" type="email" value={profile.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="Optional, for demo records" />
						</div>

						<div className="field-grid">
							<div className="field-block">
								<label htmlFor="occupation">Occupation</label>
								<select id="occupation" value={profile.occupation} onChange={(e) => handleChange("occupation", e.target.value)}>
									<option value="delivery">Delivery Partner</option>
									<option value="rider">Rider / Courier</option>
									<option value="logistics">Logistics Partner</option>
									<option value="food">Food Delivery</option>
								</select>
							</div>
							<div className="field-block">
								<label htmlFor="area">Delivery Zone</label>
								<select id="area" value={profile.area} onChange={(e) => handleChange("area", e.target.value)}>
									<option value="safe">Safe Zone (Low risk)</option>
									<option value="heat">Heat Zone (High temperature stress)</option>
									<option value="flood">Flood Zone (Waterlogging risk)</option>
									<option value="coastal">Coastal Zone (Wind & cyclone risk)</option>
								</select>
							</div>
						</div>

						<div className="field-grid">
							<div className="field-block">
								<label htmlFor="weeklyIncome">Weekly Income (₹)</label>
								<input id="weeklyIncome" type="number" value={profile.weeklyIncome} onChange={(e) => handleChange("weeklyIncome", Number(e.target.value))} placeholder="e.g., 8000" />
							</div>
							<div className="field-block">
								<label htmlFor="weeklyHours">Weekly Hours Worked</label>
								<input id="weeklyHours" type="number" value={profile.weeklyHours} onChange={(e) => handleChange("weeklyHours", Number(e.target.value))} placeholder="e.g., 40" />
							</div>
						</div>

						<div className="field-grid">
							<div className="field-block">
								<label htmlFor="vehicleAge">Vehicle Age (years)</label>
								<input id="vehicleAge" type="number" value={profile.vehicleAge} onChange={(e) => handleChange("vehicleAge", Number(e.target.value))} placeholder="e.g., 2" />
							</div>
							<div className="field-block">
								<label htmlFor="deviceReliability">Device Reliability</label>
								<select id="deviceReliability" value={profile.deviceReliability} onChange={(e) => handleChange("deviceReliability", e.target.value)}>
									<option value="high">High (Modern phone, good battery)</option>
									<option value="medium">Medium (Works but aging)</option>
									<option value="low">Low (Frequent issues)</option>
								</select>
							</div>
						</div>

						<div className="field-block">
							<label htmlFor="coverageHours">Desired Daily Coverage Hours</label>
							<select id="coverageHours" value={profile.coverageHours} onChange={(e) => handleChange("coverageHours", Number(e.target.value))}>
								<option value={24}>24 hours (All day)</option>
								<option value={20}>20 hours (Peak hours focus)</option>
								<option value={12}>12 hours (Half day)</option>
							</select>
						</div>

						{error && <p className="error-text">{error}</p>}

						<div className="form-actions">
							<button type="button" className="btn btn-secondary" onClick={onBack}>
								Back
							</button>
							<button type="submit" className="btn btn-primary" disabled={saving}>
								{saving ? "Activating..." : "Activate Protection"}
							</button>
						</div>
					</form>
				</div>
			</section>
		</main>
	);
}

export default RegisterPage;
