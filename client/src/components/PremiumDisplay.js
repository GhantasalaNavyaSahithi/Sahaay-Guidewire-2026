import React, { useState } from "react";
import API from "../services/api";

function PremiumDisplay() {
  const [data, setData] = useState(null);

  const getPremium = async (area) => {
    const res = await API.get(`/premium/${area}`);
    setData(res.data);
  };

  return (
    <div>
      <h2>Premium Calculator</h2>

      <button onClick={() => getPremium("flood")}>Flood Area</button>
      <button onClick={() => getPremium("safe")}>Safe Area</button>
      <button onClick={() => getPremium("heat")}>Heat Area</button>

      {data && (
        <div>
          <p>Base: ₹{data.base}</p>
          <p>Adjustment: ₹{data.adjustment}</p>
          <p><b>Final: ₹{data.finalPremium}</b></p>
        </div>
      )}
    </div>
  );
}

export default PremiumDisplay;