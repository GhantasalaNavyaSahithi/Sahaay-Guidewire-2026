import React from "react";

function PolicyCard() {
	return (
		<article className="card policy-card">
			<h3>Policy Status</h3>
			<p className="status-pill">Active</p>
			<p>Coverage: Weather + Platform downtime</p>
			<p className="helper-text">Your policy is always on and monitored in real time.</p>
		</article>
	);
}

export default PolicyCard;
