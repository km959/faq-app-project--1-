"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api, session } from "../../lib/api";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [awaitingAlert, setAwaitingAlert] = useState(false);
  const chatContainerRef = useRef(null);
  

  useEffect(function () {
    const token = session.getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const currentUser = session.getUser();
    if (currentUser && currentUser.role === "admin") {
      router.replace("/admin");
      return;
    }
    setUser(currentUser);

    const key = `chat_history_${currentUser.email}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(function () {
  if (chatContainerRef.current) {
    requestAnimationFrame(function () {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    });
  }
}, [items, sending]);

  useEffect(function () {
  function handleHardRefresh(event) {
    if (
      event.ctrlKey &&
      event.shiftKey &&
      event.key.toLowerCase() === "r"
    ) {
      if (user) {
        localStorage.removeItem(
          `chat_history_${user.email}`
        );
      }

      localStorage.removeItem("chat_history");
    }
  }

  window.addEventListener(
    "keydown",
    handleHardRefresh
  );

  return function () {
    window.removeEventListener(
      "keydown",
      handleHardRefresh
    );
  };
}, [user]);

  useEffect(function () {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return function () {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen]);

  function handleLogout() {
    session.clearSession();
    router.replace("/");
  }

  function buildHistory() {
    return items
      .filter(function (it) { return it.kind === "user" || it.kind === "bot"; })
      .slice(-10)
      .map(function (it) {
        return { role: it.kind === "user" ? "user" : "assistant", text: it.text };
      });
  }

  function typeOutMessage(fullText, onDone) {
    setItems(function (prev) {
      return prev.concat([{ kind: "bot", text: "" }]);
    });

    let index = 0;
    const speed = 15;

    const interval = setInterval(function () {
      index += 3;
      setItems(function (prev) {
        const updated = prev.slice();
        const lastIndex = updated.length - 1;
        updated[lastIndex] = { kind: "bot", text: fullText.slice(0, index) };
        return updated;
      });

      if (index >= fullText.length) {
        clearInterval(interval);
        if (onDone) onDone();
      }
    }, speed);
  }

  function freshGreeting() {
    const realName = user ? user.name : "there";
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : "Good evening";
    const greetingText = `${timeGreeting}, ${realName}! I'm here to help. Ask me anything, or try one of these:`;

    setItems([]);
    setError("");
    setDraft("");

    typeOutMessage(greetingText, function () {
      setItems(function (prev) {
        const updated = prev.slice();
        updated[updated.length - 1] = {
          kind: "bot",
          text: greetingText,
          suggestionLabel: "Search for Jobs",
          suggestions: [
            { label: "Guided Job Search", query: "__guided_job_search__" },
            { label: "Upload Resume", query: "__upload_resume__" },
            { label: "Ask a Question", query: "__ask_a_question__" },
            { label: "Latest Jobs", query: "__latest_jobs__" },
            { label: "Set Job Alerts", query: "__set_job_alerts__" },
          ],
        };
        return updated;
      });
    });
  }

  function toggleWidget() {
    const next = !widgetOpen;
    setWidgetOpen(next);
    setMenuOpen(false);
    if (next && items.length === 0) {
      freshGreeting();
    }
  }

  async function submitQuestion(rawText) {
    const question = rawText.trim();
    if (!question) return;

    const history = buildHistory();

    setItems(function (prev) { return prev.concat([{ kind: "user", text: question }]); });
    setDraft("");
    setSending(true);
    setError("");

    try {
      const res = await api.askFaq(question, history, false);
      setSending(false);

      if (res.source === "suggestions") {
        typeOutMessage(res.answer, function () {
          setItems(function (prev) {
            const updated = prev.slice();
            updated[updated.length - 1] = {
              kind: "bot",
              text: res.answer,
              suggestions: res.suggestions,
            };
            return updated;
          });
        });
      } else if (res.source === "ticket") {
        typeOutMessage(res.answer, function () {
          setItems(function (prev) {
            return prev.concat([{ kind: "ticket_card", ticket: res.ticket }]);
          });
        });
      } else if (res.related_questions && res.related_questions.length > 0) {
  const lowerQuestion = question.toLowerCase();

  const showUpload =
    lowerQuestion.includes("resume") ||
    lowerQuestion.includes("cv");

  typeOutMessage(res.answer, function () {
    setItems(function (prev) {
      const updated = prev.slice();

      updated[updated.length - 1] = {
        kind: "bot",
        text: res.answer,
        showUpload: showUpload,
        suggestionLabel: res.related_label,
        suggestions: res.related_questions,
      };

      return updated;
    });
  });
} else {
  const lowerQuestion = question.toLowerCase();

  const showUpload =
    lowerQuestion.includes("resume") ||
    lowerQuestion.includes("cv");

  typeOutMessage(res.answer, function () {
    if (showUpload) {
      setItems(function (prev) {
        const updated = prev.slice();

        updated[updated.length - 1] = {
          kind: "bot",
          text: res.answer,
          showUpload: true,
        };

        return updated;
      });
    }
  });
}
    } catch (err) {
      setSending(false);
      setError(err.message);
    }
  }

  async function handleSuggestionClick(question, label) {
    setItems(function (prev) { return prev.concat([{ kind: "user", text: label || question }]); });
    setSending(true);
    setError("");

    try {
      const res = await api.askFaq(question, buildHistory(), true);
      setSending(false);
      const lowerQuestion = String(question || "").toLowerCase();

const showUpload =
  question === "__upload_resume__" ||
  (
    lowerQuestion.includes("resume") &&
    (
      lowerQuestion.includes("upload") ||
      lowerQuestion.includes("update") ||
      lowerQuestion.includes("submit") ||
      lowerQuestion.includes("attach")
    )
  );
      typeOutMessage(res.answer, function () {
        if (question === "__set_job_alerts__") setAwaitingAlert(true);

        if (showUpload || (res.related_questions && res.related_questions.length > 0)) {
          setItems(function (prev) {
            const updated = prev.slice();
            updated[updated.length - 1] = {
              kind: "bot",
              text: res.answer,
              showUpload: showUpload,
              suggestionLabel: res.related_label,
              suggestions: res.related_questions,
            };
            return updated;
          });
        }
      });
    } catch (err) {
      setSending(false);
      setError(err.message);
    }
  }

  async function handleResumeFile(file) {
    if (!file) return;
    setSending(true);
    try {
      const res = await api.uploadResume(file);
      setItems(function (prev) {
        return prev.concat([
          { kind: "user", text: file.name },
          { kind: "bot", text: `Your resume "${res.filename}" has been uploaded successfully!` },
        ]);
      });
    } catch (err) {
      setItems(function (prev) {
        return prev.concat([{ kind: "bot", text: err.message }]);
      });
    } finally {
      setSending(false);
    }
  }

  async function handleViewTicketsInline() {
    setMenuOpen(false);
    try {
      const tickets = await api.listMyTickets();
      setItems(function (prev) { return prev.concat([{ kind: "my_tickets", tickets: tickets }]); });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    if (awaitingAlert) {
      const preference = draft.trim();
      setItems(function (prev) {
        return prev.concat([
          { kind: "user", text: preference },
          { kind: "bot", text: `Got it! We'll keep an eye out for "${preference}" roles and let you know when something matches.` },
        ]);
      });
      setDraft("");
      setAwaitingAlert(false);
      return;
    }
    submitQuestion(draft);
  }

  const isLast = function (index) { return index === items.length - 1; };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="font-bold text-xl">Healthcare Portal</div>
        <div className="flex items-center gap-5 text-sm">
          <Link
            href="/dashboard/jobs"
            className={pathname === "/dashboard/jobs" ? "font-bold" : "font-normal"}
          >
            Jobs
          </Link>
          <Link
            href="/dashboard/profile"
            className={pathname === "/dashboard/profile" ? "font-bold" : "font-normal"}
          >
            Profile
          </Link>
          <button onClick={handleLogout} className="bg-white/20 border-none text-white px-3.5 py-2 rounded-lg">
            Log Out
          </button>
        </div>
      </div>

      {children}

      <div
        onClick={toggleWidget}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center text-sm font-bold cursor-pointer shadow-lg z-50"
      >
        AI
      </div>

      {widgetOpen && (
        <div className="fixed bottom-24 right-6 w-[340px] h-[440px] bg-white border border-blue-200 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="px-3.5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold flex justify-between items-center">
            <span>AI Support</span>
            <span onClick={function () { setWidgetOpen(false); }} className="cursor-pointer text-sm">✕</span>
          </div>

          <div
            ref={chatContainerRef}
            className="overflow-y-auto p-3 flex-1 flex flex-col gap-2 min-h-0"
          >
            {items.map(function (it, i) {
              if (it.kind === "ticket_card") {
                return (
                  <div key={i} className="self-start max-w-[85%] mr-auto text-sm text-gray-900">
                    <div className="font-semibold">
                      Ticket ID: TKT-{String(it.ticket.ticket_number || 0).padStart(4, "0")}
                    </div>
                    <div className="text-gray-700 mt-1">
                      Our team will contact you shortly.
                    </div>
                  </div>
                );
              }

              if (it.kind === "my_tickets") {
                return (
                  <div key={i} className="self-start max-w-[90%] mr-auto text-sm text-gray-900">
                    <div className="font-semibold mb-1.5">Your Tickets</div>
                    {it.tickets.length === 0 && <div className="text-gray-400 text-xs">No tickets raised yet.</div>}
                    {it.tickets.map(function (t) {
                      return (
                        <div key={t.id} className="mb-2">
                          <div className="font-medium">
                            Ticket ID: TKT-{String(t.ticket_number || 0).padStart(4, "0")}
                          </div>
                          <div className="text-gray-700 text-xs mt-0.5">
                            Our team will contact you shortly.
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div key={i} className="flex flex-col gap-1.5">
                  {it.text && (
                    <div
                      className={`w-fit max-w-[80%] rounded-lg px-2.5 py-1.5 text-sm break-words whitespace-pre-line ${
                        it.kind === "bot"
                          ? "mr-auto bg-blue-50 text-gray-800 border border-blue-100"
                          : "ml-auto bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                      }`}
                    >
                      {it.text}
                    </div>
                  )}

                  {it.kind === "bot" && it.showUpload && isLast(i) && (
                    <div className="mr-auto max-w-[85%] border border-blue-200 rounded-lg p-3 text-center bg-white">
                      <p className="text-xs text-gray-500 mb-2">Drag & drop or choose a file</p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        id="resume-upload-input"
                        className="hidden"
                        onChange={function (e) { handleResumeFile(e.target.files[0]); }}
                      />
                      <label
                        htmlFor="resume-upload-input"
                        className="inline-block cursor-pointer px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold"
                      >
                        Upload New Resume
                      </label>
                      <p className="text-[10px] text-gray-400 mt-2">Supported: pdf, doc, docx, txt (max 1MB)</p>
                    </div>
                  )}

                  {it.kind === "bot" && it.suggestions && isLast(i) && (
                    <div className="flex flex-col gap-1.5 mr-auto max-w-[85%]">
                      {it.suggestionLabel && (
                        <span className="text-xs font-semibold text-gray-500 mt-1">{it.suggestionLabel}</span>
                      )}
                      {it.suggestions.map(function (s, si) {
                        const isObj = typeof s === "object";
                        const label = isObj ? s.label : s;
                        const query = isObj ? s.query : s;
                        return (
                          <button
                            key={si}
                            type="button"
                            onClick={function () { handleSuggestionClick(query, label); }}
                            className="text-left text-xs px-3 py-2 rounded-lg border border-blue-200 text-black bg-white hover:bg-blue-50"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {sending && <div className="text-xs text-gray-400 self-start">Thinking...</div>}
            {error && <div className="text-xs text-red-500 self-start">{error}</div>}

            
          </div>

          <form ref={menuRef} onSubmit={handleSend} className="flex items-center gap-1.5 p-2.5 border-t border-gray-100 relative">
            <span
              onClick={function () { setMenuOpen(function (v) { return !v; }); }}
              className="cursor-pointer text-lg text-gray-400 px-1"
            >
              ☰
            </span>

            {menuOpen && (
              <div className="absolute bottom-11 left-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 w-40 text-sm z-10">
                <button
                  onClick={handleViewTicketsInline}
                  className="w-full text-left px-3.5 py-2 text-black hover:bg-gray-50 cursor-pointer"
                >
                  View Tickets
                </button>
              </div>
            )}

            <input
              value={draft}
              onChange={function (e) { setDraft(e.target.value); }}
              placeholder="Ask anything..."
              className="flex-1 text-sm border border-gray-300 rounded-lg px-2.5 py-2"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="w-8.5 h-8.5 rounded-full border-none bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center text-sm shrink-0 cursor-pointer"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}