"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, session } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await api.login(email, password, role)
          : await api.register(email, password, name, phone, role);

      session.setSession(data.access_token, data.user);
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>{mode === "login" ? "Log In" : "Sign Up"}</h1>

      <label>Login as</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setRole("user")}
          style={{ flex: 1, background: role === "user" ? "#00e676" : "#f2f2f2" }}
        >
          User
        </button>
        <button
          type="button"
          onClick={() => setRole("admin")}
          style={{ flex: 1, background: role === "admin" ? "#00e676" : "#f2f2f2" }}
        >
          Admin
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "register" && (
          <>
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />

            <label htmlFor="phone">Phone</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </>
        )}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} style={{ background: "#00e676", width: "100%" }}>
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
        </button>
      </form>

      <button
        type="button"
        className="toggle-link"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError("");
        }}
      >
        {mode === "login" ? "Need an account? Sign Up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}