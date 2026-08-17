"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, session } from "../../lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    const token = session.getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const u = session.getUser();
    if (!u || u.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    setUser(u);
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTickets() {
    setError("");
    try {
      const data = await api.listAllTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    session.clearSession();
    router.replace("/login");
  }

  if (!user || loading) {
    return (
      <div className="container-wide">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-wide">
      <div className="top-bar">
        <h1>Admin - All Tickets</h1>
        <button className="secondary" onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #cccccc", textAlign: "left" }}>
            <th style={{ padding: 8 }}>User Email</th>
            <th style={{ padding: 8 }}>Subject</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(function (t) {
            const isOpen = expandedId === t.id;
            return (
              <>
                <tr key={t.id} style={{ borderBottom: "1px solid #eeeeee" }}>
                  <td style={{ padding: 8 }}>{t.user_email}</td>
                  <td style={{ padding: 8 }}>{t.subject}</td>
                  <td style={{ padding: 8, textTransform: "uppercase", fontSize: 12 }}>{t.status}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => setExpandedId(isOpen ? null : t.id)}>
                      {isOpen ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr key={t.id + "-detail"}>
                    <td colSpan={4} style={{ padding: 12, background: "#f9f9f9", fontSize: 14 }}>
                      <div>
                        <strong>Contact:</strong> {t.contact_name} · {t.contact_email}
                        {t.contact_phone ? ` · ${t.contact_phone}` : ""}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <strong>Description:</strong> {t.description}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>

      {tickets.length === 0 && <p>No tickets have been raised yet.</p>}
    </div>
  );
}