# Sahaay 
### AI-Powered Income Protection for Food Delivery Heroes

**Sahaay** is a parametric insurance platform designed to protect the livelihoods of food delivery partners. Unlike traditional insurance, Sahaay focuses strictly on **Loss of Income** caused by external disruptions like extreme weather, environmental hazards, and social unrest.

---

## 🚩 The Problem & Persona
* **Target Persona:** Bike-based food delivery partners (e.g., Zomato, Swiggy).
* **The Gap:** When extreme rain or heat hits, these workers cannot deliver. They lose their daily wages and peak-time incentives. Currently, no safety net exists for these "lost hours."
* **Our Mission:** To ensure that a "No-Work Day" due to external factors doesn't mean a "No-Pay Day."

---

## 💰 Weekly Financial Model
Following the typical earnings cycle of gig workers, Sahaay operates on a **Weekly** basis:
* **Weekly Premium:** ₹25 (Fixed).
* **Coverage Scope:** Loss of income only (Excludes health, life, and vehicle repairs).
* **Payout Method:** Automated digital wallet transfer at the end of the week or immediately upon trigger.

---

## ⚡ Parametric Triggers
We use real-time data to trigger claims automatically. No paperwork is required from the driver.

| Disruption Type | Data Source | Trigger Threshold |
| :--- | :--- | :--- |
| **Heavy Rainfall** | OpenWeather API | > 15mm of rain in 1 hour in the delivery zone. |
| **Extreme Heat** | OpenWeather API | Temperature > 44°C for 3+ consecutive hours. |
| **Social Disruption**| Google News/Mocks | Section 144 or "Zone Closure" alerts. |

---

## 🧠 AI & ML Strategy
1. **Dynamic Risk Assessment:** We use ML models to analyze historical weather patterns and forecast upcoming risks to ensure the ₹25 premium remains sustainable.
2. **Intelligent Fraud Detection:**
    * **Location Validation:** Cross-referencing the worker's GPS pings with the specific weather-affected grid.
    * **Activity Consistency:** Verifying the worker was marked "Online" on their delivery platform during the disruption.
    * **Anti-Spoofing:** AI flags accounts using "Mock Location" or GPS-masking apps to claim false payouts.

---

## 🛠️ Tech Stack & Development Plan
* **Platform:** Mobile-first Web App (React.js).
* **Backend:** Python (FastAPI) for high-speed trigger processing.
* **Database:** MongoDB (to handle weekly policy cycles).
* **Integration:** OpenWeather API (Weather), Google Maps (Location), Razorpay Sandbox (Simulated Payouts).

---

## 📺 Phase 1 Video Submission
[Link to My 2-Minute Strategy Video](https://youtu.be/IMSWTLEU8Vg)

---
*Developed for the Guidewire DEVTrails Hackathon 2026.*
