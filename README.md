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

---

## ✅ Phase 3 (Scale & Optimize) - Implemented

### 1) Anti-Cheating Fraud Detection
- **GPS validation:** claim location is validated against the impacted zone center.
- **Data verification:** claim reason is cross-checked against live/mock weather signals.
- **Spoofing detection:** mock-location, provider mismatch, impossible speed, and low-trust device signals are flagged.

### 2) Instant Payout (Sandbox Simulation)
- Added a **mock payout gateway** that behaves like Razorpay test-mode settlement.
- On approved claims, payout is credited immediately to the in-app worker wallet with references like `rzp_test_*`.

### 3) Dual Dashboards
- **Worker dashboard:** weekly coverage, total earned-back amount, weather alert, and claim activity.
- **Admin dashboard:** paid vs flagged claims, riskiest areas, disruption forecast, and live simulation controls.

### 4) Final Demo Assets
- Video runbook: `PHASE3_DEMO_RUNBOOK.md`
- Pitch deck content: `PHASE3_PITCH_DECK.md` (export to PDF)

### 5) New Phase 3 APIs
- `GET /api/dashboard/worker/:userId` - Worker overview
- `GET /api/dashboard/admin/overview` - Admin analytics
- `GET /api/claim/trigger/:type` - Manual disruption trigger
- `POST /api/claim/trigger/:type` - Trigger with payload for anti-cheat simulation
- `GET /api/claim/trigger/rain?mockLocation=1&provider=mock-gps` - Spoof attempt demo

## 🚀 Deploy From GitHub (Render)

This repository is configured for one-service deployment using `render.yaml`.

1. Go to Render dashboard and choose **New +** > **Blueprint**.
2. Connect the repository: `GhantasalaNavyaSahithi/Sahaay-Guidewire-2026`.
3. Render auto-detects `render.yaml` and creates the service.
4. Click **Apply** to deploy.
5. Open `/healthz` on your Render URL to confirm status.

Notes:
- Backend and frontend run in one Node service.
- In production, frontend API calls use same-origin `/api` automatically.
