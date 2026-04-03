import React, { useState } from "react";
import API from "../services/api";

function Register() {
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    const res = await API.post("/users/register", { name });
    alert(res.data.message);
  };

  return (
    <div>
      <h2>Register</h2>
      <input
        placeholder="Enter Name"
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleSubmit}>Register</button>
    </div>
  );
}

export default Register;