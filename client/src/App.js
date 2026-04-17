import React, { useEffect, useState } from "react";
import "./App.css";
import Home from "./pages/Home";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

const ADMIN_ACCESS_CODE = process.env.REACT_APP_ADMIN_DEMO_CODE || "phase3-admin";

function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);
  const [adminGateOpen, setAdminGateOpen] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ name: "", code: "" });
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    const savedUser = window.localStorage.getItem("sahaayUser");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setScreen("dashboard");
      } catch (error) {
        window.localStorage.removeItem("sahaayUser");
      }
    }
  }, []);

  const handleRegistered = (registeredUser) => {
    setUser(registeredUser);
    window.localStorage.setItem("sahaayUser", JSON.stringify(registeredUser));
    setScreen("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    window.localStorage.removeItem("sahaayUser");
    setScreen("home");
  };

  const handleUpdateProfile = () => {
    setScreen("register");
  };

  const openAdmin = () => {
    setAdminCredentials({ name: "", code: "" });
    setAdminError("");
    setAdminGateOpen(true);
  };

  const closeAdminGate = () => {
    setAdminGateOpen(false);
    setAdminCredentials({ name: "", code: "" });
    setAdminError("");
  };

  const submitAdminGate = (event) => {
    event.preventDefault();

    const enteredName = adminCredentials.name.trim().toLowerCase();
    const enteredCode = adminCredentials.code.trim();

    if (!enteredName || !enteredCode) {
      setAdminError("Enter the admin name and access code.");
      return;
    }

    if (enteredName !== "admin" || enteredCode !== ADMIN_ACCESS_CODE) {
      setAdminError("Invalid admin credentials.");
      return;
    }

    window.localStorage.setItem("sahaayAdminAccess", "granted");
    setAdminGateOpen(false);
    setScreen("admin");
  };

  return (
    <div className="app-shell">
      {screen === "home" && <Home onGetStarted={() => setScreen("register")} onOpenAdmin={openAdmin} />}

      {screen === "register" && (
        <RegisterPage
          onBack={() => setScreen("home")}
          onRegistered={handleRegistered}
        />
      )}

      {screen === "dashboard" && user && (
        <DashboardPage
          user={user}
          onRestart={handleUpdateProfile}
          onLogout={handleLogout}
        />
      )}

      {screen === "admin" && (
        <AdminDashboardPage onBackHome={() => setScreen("home")} />
      )}

      {adminGateOpen && (
        <div className="admin-gate-backdrop" role="dialog" aria-modal="true" aria-label="Admin access gate">
          <form className="admin-gate-card card" onSubmit={submitAdminGate}>
            <p className="hero-badge">Admin access required</p>
            <h2>Insurer dashboard is restricted</h2>
            <p className="subtitle">This gate is for the hackathon demo only. Enter the admin name and access code before opening the insurer dashboard.</p>

            <div className="field-block">
              <label htmlFor="adminName">Admin name</label>
              <input
                id="adminName"
                type="text"
                value={adminCredentials.name}
                onChange={(event) => setAdminCredentials((current) => ({ ...current, name: event.target.value }))}
                placeholder="admin"
              />
            </div>

            <div className="field-block">
              <label htmlFor="adminCode">Access code</label>
              <input
                id="adminCode"
                type="password"
                value={adminCredentials.code}
                onChange={(event) => setAdminCredentials((current) => ({ ...current, code: event.target.value }))}
                placeholder="Enter access code"
              />
            </div>

            {adminError ? <p className="error-text">{adminError}</p> : null}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeAdminGate}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Open Admin Dashboard
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;