import React, { useState } from "react";
import API from "../services/api";

function ClaimStatus() {
  const [result, setResult] = useState(null);

  const trigger = async (type) => {
    const res = await API.get(`/claim/trigger/${type}`);
    setResult(res.data);
  };

  return (
    <div>
      <h2>Trigger Claim</h2>

      <button onClick={() => trigger("rain")}>Rain 🌧️</button>
      <button onClick={() => trigger("heat")}>Heat 🔥</button>
      <button onClick={() => trigger("downtime")}>Downtime 🚫</button>

      {result && (
        <div>
          <p>{result.message}</p>
          <h3>💰 ₹{result.payout}</h3>
        </div>
      )}
    </div>
  );
}

export default ClaimStatus;