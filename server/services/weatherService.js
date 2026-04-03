const zoneCoordinates = {
	safe: { latitude: 28.6139, longitude: 77.209 },
	heat: { latitude: 26.9124, longitude: 75.7873 },
	flood: { latitude: 22.5726, longitude: 88.3639 },
	coastal: { latitude: 19.076, longitude: 72.8777 }
};

const createMockSnapshot = (area) => {
	const map = {
		safe: {
			temperature: 31,
			precipitationProbability: 12,
			windSpeed: 10,
			summary: "Clear stretch with low waterlogging risk"
		},
		heat: {
			temperature: 39,
			precipitationProbability: 8,
			windSpeed: 14,
			summary: "High heat load and long riding fatigue"
		},
		flood: {
			temperature: 30,
			precipitationProbability: 78,
			windSpeed: 18,
			summary: "Heavy rain pockets with waterlogging risk"
		},
		coastal: {
			temperature: 29,
			precipitationProbability: 62,
			windSpeed: 26,
			summary: "Cyclonic wind band with route disruption risk"
		}
	};

	return {
		source: "mock-weather",
		area,
		...map[area]
	};
};

async function getWeatherSnapshot(area = "safe") {
	const coordinates = zoneCoordinates[area] || zoneCoordinates.safe;
	const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability,temperature_2m&timezone=auto`;

	try {
		const response = await fetch(weatherUrl);

		if (!response.ok) {
			throw new Error(`Weather API responded ${response.status}`);
		}

		const data = await response.json();
		const current = data.current || {};
		const hourly = data.hourly || {};
		const precipitationProbability = Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability[0] || 0 : 0;
		const temperature = current.temperature_2m ?? (Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m[0] || 30 : 30);
		const windSpeed = current.wind_speed_10m ?? 10;

		return {
			source: "open-meteo",
			area,
			temperature,
			precipitationProbability,
			windSpeed,
			summary: precipitationProbability >= 60
				? "Forecast shows strong rain probability"
				: temperature >= 36
					? "Forecast shows elevated heat stress"
					: "Forecast looks calm and manageable"
		};
	} catch (error) {
		return createMockSnapshot(area);
	}
}

const detectWeatherTriggers = (snapshot = {}) => {
	const triggers = [];
	const precipitationProbability = Number(snapshot.precipitationProbability || 0);
	const temperature = Number(snapshot.temperature || 0);
	const windSpeed = Number(snapshot.windSpeed || 0);

	if (precipitationProbability >= 55) {
		triggers.push({
			type: "rain",
			label: "Rain Alert",
			source: snapshot.source || "weather-api",
			severity: precipitationProbability >= 75 ? "critical" : "high",
			payoutAmount: 150,
			message: "Heavy rain is likely to interrupt deliveries"
		});
	}

	if (precipitationProbability >= 70) {
		triggers.push({
			type: "waterlogging",
			label: "Waterlogging Risk",
			source: snapshot.source || "weather-api",
			severity: "critical",
			payoutAmount: 180,
			message: "Wet streets are likely to slow or stop routes"
		});
	}

	if (temperature >= 36) {
		triggers.push({
			type: "heat",
			label: "Heatwave Alert",
			source: snapshot.source || "weather-api",
			severity: temperature >= 40 ? "critical" : "medium",
			payoutAmount: 120,
			message: "Heat stress is likely to reduce delivery hours"
		});
	}

	if (windSpeed >= 24 || (precipitationProbability >= 40 && windSpeed >= 16)) {
		triggers.push({
			type: "route",
			label: "Route Blockage",
			source: snapshot.source || "weather-api",
			severity: "medium",
			payoutAmount: 110,
			message: "Wind and rain are likely to slow travel times"
		});
	}

	return triggers;
};

module.exports = {
	detectWeatherTriggers,
	getWeatherSnapshot
};
