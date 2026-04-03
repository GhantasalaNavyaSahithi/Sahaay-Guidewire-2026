const { buildDynamicQuote } = require("../services/premiumService");

const calculatePremium = async (req, res) => {
  const profile = {
    area: req.params.area || req.body.area || req.query.area,
    occupation: req.body.occupation || req.query.occupation,
    weeklyIncome: req.body.weeklyIncome || req.query.weeklyIncome,
    weeklyHours: req.body.weeklyHours || req.query.weeklyHours,
    vehicleAge: req.body.vehicleAge || req.query.vehicleAge,
    deviceReliability: req.body.deviceReliability || req.query.deviceReliability,
    coverageHours: req.body.coverageHours || req.query.coverageHours
  };

  const quote = await buildDynamicQuote(profile);

  return res.json({
    ...quote,
    profile
  });
};

const calculatePremiumQuote = async (req, res) => calculatePremium(req, res);

module.exports = { calculatePremium, calculatePremiumQuote };