const { getAutomationFeed, getAutomationStatus, scanPolicies } = require("../services/triggerService");

const scanTriggers = async (req, res) => {
  const claims = await scanPolicies();
  return res.json({
    message: "Automation scan completed",
    claims,
    status: getAutomationStatus()
  });
};

const getTriggersFeed = (req, res) => {
  return res.json({
    feed: getAutomationFeed(),
    status: getAutomationStatus()
  });
};

module.exports = {
  getTriggersFeed,
  scanTriggers
};