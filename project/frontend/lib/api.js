const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function setSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = "Something went wrong";
    try {
      const data = await res.json();
      if (Array.isArray(data.detail)) {
        detail = data.detail.map((d) => d.msg).join(", ");
      } else if (typeof data.detail === "string") {
        detail = data.detail;
      }
    } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (email, password, name, phone, role) =>
    request("/auth/register", { method: "POST", body: { email, password, name, phone, role } }),
  login: (email, password, role) =>
    request("/auth/login", { method: "POST", body: { email, password, role } }),

  listFaqs: () => request("/faqs", { auth: true }),
  createFaq: (question, answer) =>
    request("/faqs", { method: "POST", body: { question, answer }, auth: true }),

  listMyTickets: () => request("/tickets", { auth: true }),
  listAllTickets: () => request("/tickets/all", { auth: true }),
  createTicket: (contact_name, contact_email, contact_phone, subject, description) =>
    request("/tickets", {
      method: "POST",
      body: { contact_name, contact_email, contact_phone, subject, description },
      auth: true,
    }),

  listJobs: (q, location) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    const qs = params.toString();
    return request(`/jobs${qs ? `?${qs}` : ""}`);
  },
};

export const session = { getToken, setSession, clearSession, getUser };