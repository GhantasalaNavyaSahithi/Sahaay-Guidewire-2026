const { getWeatherSnapshot } = require("./weatherService");

const zoneCoordinates = {
  safe: { latitude: 28.6139, longitude: 77.209 },
  heat: { latitude: 26.9124, longitude: 75.7873 },
  flood: { latitude: 22.5726, longitude: 88.3639 },
  coastal: { latitude: 19.076, longitude: 72.8777 }
};

const toRadians = (value) => (Number(value || 0) * Math.PI) / 180;

const haversineDistanceKm = (pointA, pointB) => {
  const earthRadiusKm = 6371;
  const latDiff = toRadians(pointB.latitude - pointA.latitude);
  const lonDiff = toRadians(pointB.longitude - pointA.longitude);
  const startLat = toRadians(pointA.latitude);
  const endLat = toRadians(pointB.latitude);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const checkWeatherSignal = ({ claimType, weatherSnapshot }) => {
  const precipitation = Number(weatherSnapshot?.precipitationProbability || 0);
  const temperature = Number(weatherSnapshot?.temperature || 0);
  const windSpeed = Number(weatherSnapshot?.windSpeed || 0);

  if (claimType === "rain") {
    return precipitation >= 50;
  }

  if (claimType === "waterlogging") {
    return precipitation >= 65;
  }

  if (claimType === "heat") {
    return temperature >= 35;
  }

  if (claimType === "route") {
    return precipitation >= 35 || windSpeed >= 20;
  }

  if (claimType === "downtime") {
    return true;
  }

  return false;
};

const checkNewsSignal = ({ claimType, area }) => {
  if (claimType !== "downtime") {
    return {
      matched: true,
      source: "weather-first",
      summary: `No external news verification needed for ${claimType}`
    };
  }

  return {
    matched: true,
    source: "status-feed",
    summary: `Platform disruption signal acknowledged for ${area}`
  };
};

const checkSpoofingRisk = ({ location, deviceMeta, user }) => {
  const flags = [];

  if (deviceMeta?.isMockLocationApp) {
    flags.push("mock location app detected");
  }

  if (deviceMeta?.gpsProvider && String(deviceMeta.gpsProvider).toLowerCase().includes("mock")) {
    flags.push("gps provider mismatch");
  }

  if (Number(deviceMeta?.speedKmph || 0) > 120) {
    flags.push("impossible travel speed");
  }

  if (Number(location?.accuracyMeters || 0) > 2000) {
    flags.push("low gps accuracy");
  }

  if ((user?.deviceReliability || "medium") === "low") {
    flags.push("historically low device trust");
  }

  return {
    hasCriticalSpoofing: flags.some((flag) => flag.includes("mock location") || flag.includes("provider mismatch")),
    flags
  };
};

const evaluateFraudGuard = async ({ user, policy, claimType, reportedLocation, declaredReason, deviceMeta = {} }) => {
  const area = policy?.area || user?.area || "safe";
  const weatherSnapshot = await getWeatherSnapshot(area);
  const zoneCenter = zoneCoordinates[area] || zoneCoordinates.safe;
  const location = reportedLocation || {
    latitude: zoneCenter.latitude,
    longitude: zoneCenter.longitude,
    accuracyMeters: 40
  };

  const distanceFromZoneKm = haversineDistanceKm(zoneCenter, location);
  const gpsValid = distanceFromZoneKm <= 18;
  const weatherMatched = checkWeatherSignal({ claimType, weatherSnapshot });
  const newsSignal = checkNewsSignal({ claimType, area });
  const spoofing = checkSpoofingRisk({ location, deviceMeta, user });

  let confidence = 0.86;
  const reasons = [];

  if (!gpsValid) {
    confidence -= 0.32;
    reasons.push("gps mismatch with impacted zone");
  } else {
    reasons.push("gps location validated");
  }

  if (!weatherMatched) {
    confidence -= 0.28;
    reasons.push("weather signal mismatch");
  } else {
    reasons.push("weather data corroborated");
  }

  if (!newsSignal.matched) {
    confidence -= 0.1;
    reasons.push("news signal mismatch");
  }

  if (spoofing.flags.length) {
    confidence -= spoofing.hasCriticalSpoofing ? 0.36 : 0.14;
  }

  reasons.push(...spoofing.flags);

  if (!declaredReason) {
    confidence -= 0.08;
    reasons.push("missing worker declaration context");
  }

  confidence = Math.max(0.01, Math.min(0.99, confidence));

  return {
    approved: confidence >= 0.65 && !spoofing.hasCriticalSpoofing,
    confidence,
    area,
    checks: {
      gpsValidation: {
        passed: gpsValid,
        distanceFromZoneKm: Number(distanceFromZoneKm.toFixed(2)),
        zoneCenter,
        reportedLocation: location
      },
      dataVerification: {
        passed: weatherMatched,
        weatherSource: weatherSnapshot.source,
        weatherSnapshot,
        newsSource: newsSignal.source,
        newsSummary: newsSignal.summary
      },
      spoofingDetection: {
        passed: !spoofing.flags.length,
        hasCriticalSpoofing: spoofing.hasCriticalSpoofing,
        flags: spoofing.flags
      }
    },
    reasons
  };
};

module.exports = {
  evaluateFraudGuard
};
