const { buildPremiumQuote } = require("../utils/riskCalculator");
const { evaluateCoverageSignal } = require("./aiModel");
const { detectWeatherTriggers, getWeatherSnapshot } = require("./weatherService");

const buildDynamicQuote = async (profile = {}) => {
  const weatherSnapshot = await getWeatherSnapshot(profile.area || "safe");
  const aiSignal = evaluateCoverageSignal({ user: profile, weatherSnapshot });
  const weatherTriggers = detectWeatherTriggers(weatherSnapshot);
  const quote = buildPremiumQuote(profile, aiSignal);

  return {
    ...quote,
    weatherSnapshot,
    weatherTriggers,
    aiSignal
  };
};

module.exports = {
  buildDynamicQuote
};