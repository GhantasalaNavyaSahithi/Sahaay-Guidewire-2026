const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const policyRoutes = require("./routes/policyRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const claimRoutes = require("./routes/claimRoutes");
const triggerRoutes = require("./routes/triggerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { startTriggerScheduler } = require("./services/triggerService");

const app = express();
const PORT = process.env.PORT || 5000;
const clientBuildPath = path.resolve(__dirname, "../client/build");
const hasClientBuild = fs.existsSync(path.join(clientBuildPath, "index.html"));

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/claim", claimRoutes);
app.use("/api/triggers", triggerRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

if (hasClientBuild) {
  app.use(express.static(clientBuildPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/healthz") {
      return next();
    }

    return res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Sahaay Backend Running");
  });
}

startTriggerScheduler();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});