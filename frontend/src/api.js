// Thin wrapper around the FastAPI backend.
// Set VITE_API_URL in a .env file inside frontend/ to point elsewhere.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  login: (username, password, role) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password, role }) }),

  listComplaints: () => request("/complaints"),
  getComplaint: (id) => request(`/complaints/${id}`),
  createComplaint: (payload) => request("/complaints", { method: "POST", body: JSON.stringify(payload) }),
  analyzeComplaint: (id) => request(`/complaints/${id}/analyze`, { method: "POST" }),
  predictComplaint: (id) => request(`/complaints/${id}/predict`, { method: "POST" }),

  getPredictions: (caseId) => request(`/predictions/${caseId}`),
  getMoneyTrail: (caseId) => request(`/money-trail/${caseId}`),
  getRiskScore: (caseId) => request(`/risk-score/${caseId}`),
  getPredictedLocations: (caseId) => request(`/locations/predicted/${caseId}`),

  getDashboardAnalytics: () => request("/analytics/dashboard"),
  generateReport: (caseId) => request("/reports/generate", { method: "POST", body: JSON.stringify({ case_id: caseId }) }),
};
