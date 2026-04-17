import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import API from "../services/api";

const triggerCatalog = [
  { type: "rain", label: "Rain Alert", payout: 150 },
  { type: "waterlogging", label: "Waterlogging", payout: 180 },
  { type: "heat", label: "Heatwave", payout: 120 },
  { type: "route", label: "Route Blockage", payout: 110 },
  { type: "downtime", label: "Platform Downtime", payout: 100 }
];

const palette = ["#1f9f89", "#f26b38", "#4f7cff", "#f2c14e"];

function AdminDashboardPage({ onBackHome }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [message, setMessage] = useState("");

  const loadOverview = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await API.get("/dashboard/admin/overview");
      setOverview(response.data || null);
    } catch (error) {
      console.error("Admin overview error:", error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOverview();
    const interval = window.setInterval(() => loadOverview({ silent: true }), 12000);
    return () => window.clearInterval(interval);
  }, []);

  const areaRiskData = overview?.areaRisk || [];
  const forecastData = useMemo(() => {
    return (overview?.disruptionForecast || []).map((item) => ({
      ...item,
      score: Math.round(Number(item.predictedDisruption || 0) * 100)
    }));
  }, [overview]);

  const runDisasterSimulation = async (triggerType) => {
    setRunningSimulation(true);
    setMessage("Running live disruption simulation...");

    try {
      await API.get(`/claim/trigger/${triggerType}`);
      await loadOverview({ silent: true });
      setMessage(`Simulation complete: ${triggerType} disruption auto-processed and payout settled.`);
    } catch (error) {
      console.error("Simulation error:", error);
      setMessage("Simulation endpoint failed, but dashboard remains available.");
    } finally {
      setRunningSimulation(false);
    }
  };

  return (
    <main className="page page-dashboard">
      <header className="top-header card">
        <div>
          <p className="brand-mark">Sahaay Admin Console</p>
          <p className="helper-text">High-level insurer control room for live risk, fraud, and payouts.</p>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={onBackHome} type="button">
            Back to Home
          </button>
        </div>
      </header>

      <section className="dashboard-grid">
        <article className="card dashboard-hero" style={{ gridColumn: "1 / span 2" }}>
          <div className="dashboard-hero-copy">
            <p className="hero-badge">Insurer view</p>
            <h2>Portfolio pulse and anti-fraud enforcement</h2>
            <p className="subtitle">Monitor paid claims, flagged behavior, risky zones, and next-week disruption probabilities in one board.</p>
            <div className="metric-row">
              <div className="metric-card">
                <strong>{overview?.summary?.claimsPaid || 0}</strong>
                <span>Claims paid</span>
              </div>
              <div className="metric-card">
                <strong>{overview?.summary?.claimsFlagged || 0}</strong>
                <span>Claims flagged</span>
              </div>
              <div className="metric-card">
                <strong>₹{overview?.summary?.payoutTotal || 0}</strong>
                <span>Total payout</span>
              </div>
            </div>
            <div className="trust-chip-row">
              <span className="chip">Workers enrolled: {overview?.summary?.workersEnrolled || 0}</span>
              <span className="chip">Active policies: {overview?.summary?.activePolicies || 0}</span>
              <span className="chip">Scans run: {overview?.summary?.automationScans || 0}</span>
            </div>
          </div>
        </article>

        <article className="card" style={{ gridColumn: "1 / span 2" }}>
          <div className="chart-head">
            <h3>Riskiest Areas</h3>
            <p className="helper-text">Combined view of paid claims, flagged claims, and volatility score.</p>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={areaRiskData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e6f0" />
                <XAxis dataKey="area" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="claimsPaid" name="Claims Paid">
                  {areaRiskData.map((entry, index) => (
                    <Cell key={`${entry.area}-claims`} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
                <Bar dataKey="flaggedClaims" name="Flagged Claims" fill="#d9534f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card" style={{ gridColumn: "1 / span 2" }}>
          <div className="chart-head">
            <h3>Next Week Disruption Forecast</h3>
            <p className="helper-text">AI combines historical area risk and current weather signal to estimate disruption probability.</p>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecastData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e6f0" />
                <XAxis dataKey="area" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#ff7d7d" strokeWidth={3} name="Disruption probability %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card" style={{ gridColumn: "1 / span 2" }}>
          <div className="chart-head">
            <h3>Live Final-Demo Controls</h3>
            <p className="helper-text">Use these controls during the 5-minute video to simulate a disaster and auto-payout.</p>
          </div>
          <div className="trigger-grid">
            {triggerCatalog.map((trigger) => (
              <button
                key={trigger.type}
                type="button"
                className={`trigger-card ${trigger.type}`}
                disabled={runningSimulation}
                onClick={() => runDisasterSimulation(trigger.type)}
              >
                <strong>{trigger.label}</strong>
                <small>Simulate disruption</small>
                <b>₹{trigger.payout}</b>
              </button>
            ))}
          </div>
          {message ? <p className="helper-text notice-line">{message}</p> : null}
        </article>

        <article className="card" style={{ gridColumn: "1 / span 2" }}>
          <h3>Recent Payout Settlements</h3>
          {loading ? (
            <p className="helper-text">Loading admin metrics...</p>
          ) : overview?.latestPayouts?.length ? (
            <div className="feed-list">
              {overview.latestPayouts.map((payout) => (
                <div key={payout.id} className="feed-item">
                  <p className="feed-title">₹{payout.amount} settled in sandbox</p>
                  <p className="feed-description">{payout.reference} • {payout.gateway}</p>
                  <p className="feed-meta">Claim: {payout.claimId}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="helper-text">No payouts yet. Trigger a disruption to generate one.</p>
          )}
        </article>
      </section>
    </main>
  );
}

export default AdminDashboardPage;
