import axios from "axios";

// NOTE: Ensure backend IP is configured correctly here
const API_BASE_URL = () => {
  const host = window.location.hostname;

  // If  running frontend on localhost, use localhost backend
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:8080/api";
  }

  // Otherwise, use  LAN IP backend
  return "http://192.168.100.124:8080/api";
};
const apiClient = axios.create({
  baseURL: API_BASE_URL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Including token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth failures
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Session terminated by server (401). Forcing logout.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Use window.location.href to force a full redirect and state reset
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
