const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const policyRoutes = require("./routes/policyRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const claimRoutes = require("./routes/claimRoutes");
const triggerRoutes = require("./routes/triggerRoutes");
const { startTriggerScheduler } = require("./services/triggerService");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/claim", claimRoutes);
app.use("/api/triggers", triggerRoutes);

app.get("/", (req, res) => {
  res.send("Sahaay Backend Running 🚀");
});

startTriggerScheduler();

app.listen(5000, () => {
  console.log("Server running on port 5000");
});