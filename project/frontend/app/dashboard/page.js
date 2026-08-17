"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, session } from "../../lib/api";

const QUESTION_TEMPLATES = [
  "What are you looking for today,{name}?",
  "Got it, Is this your first time here?",
  "Would you like to raise a support ticket?",
  "Anything else you'd like us to know?",
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [view, setView] = useState("menu");

  const [messages, setMessages] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqDone, setFaqDone] = useState(false);

  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSaving, setTicketSaving] = useState(false);

  const [myTickets, setMyTickets] = useState([]);
  const [showTickets, setShowTickets] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(function () {
    const token = session.getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const u = session.getUser();
    if (u && u.role === "admin") {
      router.replace("/admin");
      return;
    }
    setUser(u);
    setTicketName(u ? u.name || "" : "");
    setTicketEmail(u ? u.email || "" : "");
    setTicketPhone(u ? u.phone || "" : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(function () {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function fillTemplate(t, nameValue) {
    return t.replace("{name}", nameValue || (user ? user.name : "there"));
  }

  function openMenu() {
    setView("menu");
  }

  function startFaq() {
    const realName = user ? user.name : "there";
    setMessages([
      { from: "bot", text: `Good morning, ${realName}! How can I help you today?` },
      { from: "bot", text: fillTemplate(QUESTION_TEMPLATES[0], realName) },
    ]);
    setAnswers([]);
    setCurrentIndex(0);
    setDraft("");
    setFaqDone(false);
    setView("faq");
  }

  async function handleFaqSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const answer = draft.trim();
    const rawTemplate = QUESTION_TEMPLATES[currentIndex];

    const newAnswers = answers.slice(0, currentIndex);
    newAnswers.push({ question: rawTemplate, answer: answer });

    const newMessages = messages.concat([{ from: "user", text: answer }]);
    setDraft("");

    const nextIndex = currentIndex + 1;
    if (nextIndex < QUESTION_TEMPLATES.length) {
      newMessages.push({ from: "bot", text: fillTemplate(QUESTION_TEMPLATES[nextIndex], answer) });
      setMessages(newMessages);
      setAnswers(newAnswers);
      setCurrentIndex(nextIndex);
    } else {
      setMessages(newMessages);
      setAnswers(newAnswers);
      setFaqSaving(true);
      setError("");
      try {
        for (const item of newAnswers) {
          await api.createFaq(item.question, item.answer);
        }
        setFaqDone(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setFaqSaving(false);
      }
    }
  }

  function handleFaqBack() {
    if (currentIndex === 0) return;
    const prevIndex = currentIndex - 1;
    setMessages(messages.slice(0, messages.length - 2));
    setDraft(answers[prevIndex] ? answers[prevIndex].answer : "");
    setCurrentIndex(prevIndex);
  }

  async function handleTicketSubmit(e) {
    e.preventDefault();
    setTicketSaving(true);
    setError("");
    try {
      await api.createTicket(ticketName, ticketEmail, ticketPhone, ticketSubject, ticketDescription);
      setTicketSubject("");
      setTicketDescription("");
      setView("resolved");
    } catch (err) {
      setError(err.message);
    } finally {
      setTicketSaving(false);
    }
  }

  async function loadMyTickets() {
    setError("");
    try {
      const data = await api.listMyTickets();
      setMyTickets(data);
      setShowTickets(true);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    session.clearSession();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="container-wide">
      <div className="top-bar">
        <h1>Hi, {user.name}</h1>
        <div>
          <button className="secondary" onClick={loadMyTickets} style={{ marginRight: 8 }}>
            My Tickets
          </button>
          <button className="secondary" onClick={() => router.push("/profile")} style={{ marginRight: 8 }}>
            View Profile
          </button>
          <button className="secondary" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {showTickets && (
        <div>
          <h1 style={{ marginTop: 16 }}>My Tickets</h1>
          {myTickets.length === 0 && <p>No tickets raised yet.</p>}
          {myTickets.map(function (t) {
            return (
              <div className="faq-item" key={t.id}>
                <div className="faq-question">{t.subject}</div>
                <div className="faq-answer">{t.description}</div>
                <div style={{ fontSize: 12, textTransform: "uppercase", color: "#555555", marginTop: 4 }}>
                  Status: {t.status}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        onClick={function () {
          setWidgetOpen(function (v) {
            const next = !v;
            if (next) setView("menu");
            return next;
          });
        }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          minWidth: 56,
          minHeight: 56,
          borderRadius: "50%",
          background: "#00e676",
          color: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(0,230,118,0.6)",
          zIndex: 1000,
          boxSizing: "border-box",
        }}
      >
        {widgetOpen ? "X" : "AI"}
      </div>

      {widgetOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            width: 340,
            maxHeight: 460,
            background: "#ffffff",
            border: "1px solid #cccccc",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #dddddd", fontWeight: "bold" }}>
            Support
          </div>

          {view === "menu" && (
            <div style={{ padding: 12 }}>
              <p style={{ fontSize: 14 }}>Hi {user.name}, how can I help you today?</p>
              <button onClick={startFaq} style={{ width: "100%", marginBottom: 8 }}>
                FAQ
              </button>
              <button onClick={() => setView("live_agent")} style={{ width: "100%", marginBottom: 8 }}>
                Live agent
              </button>
              <button onClick={() => setView("offline")} style={{ width: "100%", marginBottom: 8 }}>
                Offline
              </button>
              <button onClick={() => setView("ticket_form")} style={{ width: "100%" }}>
                Ticket form
              </button>
            </div>
          )}

          {view === "faq" && !faqDone && (
            <div>
              <div style={{ overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 180, maxHeight: 260 }}>
                {messages.map(function (m, i) {
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: m.from === "bot" ? "flex-start" : "flex-end",
                        background: m.from === "bot" ? "#f2f2f2" : "#e2e2e2",
                        border: "1px solid #cccccc",
                        borderRadius: 8,
                        padding: "6px 10px",
                        maxWidth: "80%",
                        fontSize: 14,
                      }}
                    >
                      {m.text}
                    </div>
                  );
                })}
                <div ref={bottomRef}></div>
              </div>
              <form onSubmit={handleFaqSend} style={{ display: "flex", gap: 6, padding: 10, borderTop: "1px solid #dddddd" }}>
                <button type="button" onClick={handleFaqBack} disabled={currentIndex === 0} style={{ marginTop: 0 }}>
                  Back
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your answer..."
                  style={{ flex: 1, fontSize: 14 }}
                  disabled={faqSaving}
                />
                <button type="submit" disabled={faqSaving || !draft.trim()} style={{ marginTop: 0 }}>
                  {faqSaving ? "..." : "Send"}
                </button>
              </form>
            </div>
          )}

          {view === "faq" && faqDone && (
            <div style={{ padding: 12 }}>
              <p style={{ fontWeight: "bold", fontSize: 14 }}>Thanks, {user.name}!</p>
              <p style={{ fontSize: 13, color: "#555555" }}>
                Your answers have been saved. If you'd like, you can raise a ticket and our team will follow up with you.
              </p>
              <button onClick={() => setView("ticket_form")} style={{ width: "100%", marginTop: 8 }}>
                Raise a Ticket
              </button>
              <button onClick={openMenu} style={{ width: "100%", marginTop: 8 }}>
                Back to menu
              </button>
            </div>
          )}

          {view === "live_agent" && (
            <div style={{ padding: 12 }}>
              <p style={{ fontSize: 14 }}>Connecting you to a live agent...</p>
              <p style={{ fontSize: 13, color: "#555555" }}>An agent will be with you shortly.</p>
              <button onClick={openMenu} style={{ width: "100%", marginTop: 8 }}>
                Back to menu
              </button>
            </div>
          )}

          {view === "offline" && (
            <div style={{ padding: 12 }}>
              <p style={{ fontSize: 14 }}>We're currently offline.</p>
              <p style={{ fontSize: 13, color: "#555555" }}>Leave us a ticket and we'll get back to you.</p>
              <button onClick={() => setView("ticket_form")} style={{ width: "100%", marginTop: 8 }}>
                Raise a ticket
              </button>
              <button onClick={openMenu} style={{ width: "100%", marginTop: 8 }}>
                Back to menu
              </button>
            </div>
          )}

          {view === "ticket_form" && (
            <form onSubmit={handleTicketSubmit} style={{ padding: 12 }}>
              <label style={{ fontSize: 12 }}>Name</label>
              <input value={ticketName} onChange={(e) => setTicketName(e.target.value)} required style={{ fontSize: 13 }} />
              <label style={{ fontSize: 12 }}>Email</label>
              <input type="email" value={ticketEmail} onChange={(e) => setTicketEmail(e.target.value)} required style={{ fontSize: 13 }} />
              <label style={{ fontSize: 12 }}>Phone</label>
              <input value={ticketPhone} onChange={(e) => setTicketPhone(e.target.value)} style={{ fontSize: 13 }} />
              <label style={{ fontSize: 12 }}>Subject</label>
              <input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} required style={{ fontSize: 13 }} />
              <label style={{ fontSize: 12 }}>Description</label>
              <textarea value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)} required style={{ fontSize: 13 }} />
              <button type="submit" disabled={ticketSaving} style={{ width: "100%", marginTop: 8 }}>
                {ticketSaving ? "Submitting..." : "Submit"}
              </button>
            </form>
          )}

          {view === "resolved" && (
            <div style={{ padding: 12 }}>
              <p style={{ fontSize: 14 }}>Ticket submitted successfully.</p>
              <p style={{ fontSize: 13, color: "#555555" }}>Status: open</p>
              <button
                onClick={function () {
                  setWidgetOpen(false);
                  setView("menu");
                }}
                style={{ width: "100%", marginTop: 8 }}
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}