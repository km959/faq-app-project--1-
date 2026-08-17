"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, session } from "../../lib/api";

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = session.getToken();
    if (!token) {
      router.replace("/");
      return;
    }
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTickets() {
    setError("");
    try {
      const data = await api.listTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const newTicket = await api.createTicket(subject, description);
      setTickets((prev) => [newTicket, ...prev]);
      setSubject("");
      setDescription("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container-wide">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-wide">
      <div className="top-bar">
        <h1>My Tickets</h1>
        <button className="secondary" onClick={() => router.push("/dashboard")}>
          Back to FAQs
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {tickets.map((ticket) => (
        <div className="faq-item" key={ticket.id}>
          <div className="faq-question">{ticket.subject}</div>
          <div className="faq-answer">{ticket.description}</div>
          <div style={{ marginTop: 6, fontSize: 12, textTransform: "uppercase", color: "#555555" }}>
            Status: {ticket.status}
          </div>
        </div>
      ))}

      <h1 style={{ marginTop: 32 }}>Raise a New Ticket</h1>
      <form onSubmit={handleCreateTicket}>
        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <button type="submit" disabled={saving}>
          {saving ? "Submitting..." : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
}