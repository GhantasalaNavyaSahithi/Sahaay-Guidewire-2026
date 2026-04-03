import React, { useEffect, useState } from "react";
import "./App.css";
import Home from "./pages/Home";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);

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

  return (
    <div className="app-shell">
      {screen === "home" && <Home onGetStarted={() => setScreen("register")} />}

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
    </div>
  );
}

export default App;