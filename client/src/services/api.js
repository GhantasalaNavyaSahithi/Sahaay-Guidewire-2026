import axios from "axios";

const configuredBaseUrl = process.env.REACT_APP_API_URL;
const fallbackBaseUrl = process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

const API = axios.create({
  baseURL: (configuredBaseUrl || fallbackBaseUrl).replace(/\/$/, "")
});

export default API;