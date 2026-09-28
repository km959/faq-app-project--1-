"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, session } from "../../lib/api";
import { formatRelativeTime } from "../../lib/format";

function ticketCode(t) {
  return String(t.ticket_number || 0).padStart(4, "0");
}

export default function AdminPage() {
  const router = useRouter();
  const menuRef = useRef(null);

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 50;

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ntName, setNtName] = useState("");
  const [ntEmail, setNtEmail] = useState("");
  const [ntPhone, setNtPhone] = useState("");
  const [ntChannel, setNtChannel] = useState("Bot");
  const [ntCompany, setNtCompany] = useState("");
  const [ntCallTime, setNtCallTime] = useState("");
  const [ntPriority, setNtPriority] = useState("Medium");
  const [ntDescription, setNtDescription] = useState("");
  const [ntErrors, setNtErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(function () {
    const token = session.getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const u = session.getUser();

    if (!u || u.role !== "admin") {
      router.replace("/dashboard/jobs");
      return;
    }

    setUser(u);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(function () {
    if (!user) return;

    loadTickets();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, statusFilter]);

  useEffect(function () {
    if (!user) return;

    const timeout = setTimeout(function () {
      setPage(1);
      loadTickets();
    }, 400);

    return function () {
      clearTimeout(timeout);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  

  useEffect(function () {
    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );
    }

    return function () {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [menuOpen]);

  async function loadTickets() {
    setError("");

    try {
      const data = await api.listAllTickets(
        page,
        PAGE_SIZE,
        search,
        statusFilter
      );

      setTickets(data.tickets);
      setTotalTickets(data.total);
      setOpenCount(data.open_count);
      setClosedCount(data.closed_count);
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

  function handleFilterClick(value) {
    setStatusFilter(value);
    setPage(1);
  }

  function goToTicket(t) {
    router.push(
      `/admin/tickets/TKT-${ticketCode(t)}`
    );
  }

  function showToast(type, title, message) {
    setToast({
      type,
      title,
      message,
    });

    setTimeout(function () {
      setToast(null);
    }, 4000);
  }

  function resetNewTicketForm() {
    setNtName("");
    setNtEmail("");
    setNtPhone("");
    setNtChannel("Bot");
    setNtCompany("");
    setNtCallTime("");
    setNtPriority("Medium");
    setNtDescription("");
    setNtErrors({});
  }

  function closeNewTicketModal() {
    if (creatingTicket) return;

    setShowNewTicket(false);
    resetNewTicketForm();
  }

  function validateNewTicket() {
  const errs = {};

  const name = ntName.trim();
  const email = ntEmail.trim();
  const company = ntCompany.trim();

  if (!name) {
    errs.name = "Name is required";
  }

  if (!email) {
    errs.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errs.email = "Invalid";
  }

  if (!company) {
    errs.company = "Company is required";
  }

  if (!ntChannel) {
    errs.channel = "Channel is required";
  }

  if (!ntPriority) {
    errs.priority = "Priority is required";
  }

  setNtErrors(errs);

  return Object.keys(errs).length === 0;
}
  async function handleCreateTicket() {
    if (!validateNewTicket()) return;

    setCreatingTicket(true);

    try {
      await api.createTicket({
      contact_name: ntName.trim(),
      contact_email: ntEmail.trim(),
      contact_phone: ntPhone.trim() || null,
      subject: ntDescription.trim().slice(0, 40) || "New Ticket",
      description: ntDescription.trim() || null,
      channel: ntChannel || "Bot",
      priority: ntPriority || "Medium",
      company: ntCompany.trim(),
       preferred_call_time: ntCallTime.trim() || null,
     });

      setShowNewTicket(false);
      resetNewTicketForm();

      showToast(
        "success",
        "Success",
        "Ticket created successfully!"
      );

      loadTickets();
    } catch (err) {
      showToast(
        "error",
        "Error",
        err.message
      );
    } finally {
      setCreatingTicket(false);
    }
  }

  const totalPages = Math.max(
    1,
    Math.ceil(totalTickets / PAGE_SIZE)
  );

  if (!user || loading) {
    return (
      <div className="w-full px-8 py-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center px-8 py-4 bg-white border-b border-gray-200 relative">
        <div
          ref={menuRef}
          className="relative"
        >
          <button
            onClick={function () {
              setMenuOpen(function (v) {
                return !v;
              });
            }}
            className="text-2xl leading-none text-black bg-transparent border-none cursor-pointer"
            aria-label="Open menu"
          >
            ☰
          </button>

          {menuOpen && (
            <div className="absolute top-10 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 w-40 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] w-80 bg-white rounded-lg shadow-xl border-l-4 flex items-start gap-3 p-4"
          style={{
            borderLeftColor:
              toast.type === "success"
                ? "#16a34a"
                : toast.type === "error"
                ? "#dc2626"
                : "#2563eb",
          }}
        >
          <span className="text-lg">
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
              ? "!"
              : "i"}
          </span>

          <div className="flex-1">
            <div className="font-semibold text-sm text-black">
              {toast.title}
            </div>

            <div className="text-xs text-gray-500 mt-0.5">
              {toast.message}
            </div>
          </div>

          <button
            onClick={function () {
              setToast(null);
            }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Ticket Panel */}
      <div className="w-full px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Header / Action Section */}
          <div className="border-b border-gray-100">

            {/* Title Section */}
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-black">
                    All Tickets
                  </h1>

                  <p className="text-sm text-gray-500 mt-1">
                    {tickets.length} of {totalTickets} tickets
                  </p>
                </div>

                <button
                  onClick={function () {
                    resetNewTicketForm();
                    setShowNewTicket(true);
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-300 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                >
                  <span className="text-base leading-none">
                    +
                  </span>

                  New ticket
                </button>
              </div>

              {/* Tickets / Overview */}
              <div className="flex items-center gap-7 mt-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 border-b-2 border-blue-600 pb-3 -mb-5">
                  Tickets

                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs">
                    {totalTickets}
                  </span>
                </div>

                <div className="text-sm text-gray-500 pb-3">
                  Overview
                </div>
              </div>
            </div>

            {/* Channel Section */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 uppercase mr-1">
                  Channel
                </span>

                <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: "#7C3AED",
                    }}
                  ></span>

                  Bot
                </span>
              </div>
            </div>

            {/* Search / Status Section */}
            <div className="px-6 pt-5 pb-6 border-t border-gray-100">
              <div className="flex items-center gap-3 flex-wrap">

                <input
                  placeholder="Search ticket ID, subject, contact..."
                  value={search}
                  onChange={function (e) {
                    setSearch(e.target.value);
                  }}
                  className="w-64 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <button
                  onClick={function () {
                    handleFilterClick("all");
                  }}
                  className={
                    statusFilter === "all"
                      ? "px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-700 text-white cursor-pointer transition-colors"
                      : "px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-300 text-gray-600 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100"
                  }
                >
                  All {openCount + closedCount}
                </button>

                <button
                  onClick={function () {
                    handleFilterClick("open");
                  }}
                  className={
                    statusFilter === "open"
                      ? "px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-700 text-white cursor-pointer transition-colors"
                      : "px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-300 text-gray-600 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100"
                  }
                >
                  Open {openCount}
                </button>

                <button
                  onClick={function () {
                    handleFilterClick("closed");
                  }}
                  className={
                    statusFilter === "closed"
                      ? "px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-700 text-white cursor-pointer transition-colors"
                      : "px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-300 text-gray-600 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100"
                  }
                >
                  Closed {closedCount}
                </button>

              </div>
            </div>
          </div>

          {/* Ticket Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-50 text-gray-800 text-left text-sm border-b border-gray-200">

                {/* Checkbox */}
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    className="cursor-pointer"
                    aria-label="Select all tickets"
                  />
                </th>

                <th className="p-3 font-semibold">
                  ID
                </th>

                <th className="p-3 font-semibold">
                  Subject
                </th>

                <th className="p-3 font-semibold">
                  Contact
                </th>

                <th className="p-3 font-semibold">
                  Channel
                </th>

                <th className="p-3 font-semibold">
                  Status
                </th>

                <th className="p-3 font-semibold">
                  Updated
                </th>

              </tr>
            </thead>

            <tbody>
              {tickets.map(function (t) {
                return (
                  <tr
                    key={t.id}
                    onClick={function () {
                      goToTicket(t);
                    }}
                    className="border-b border-gray-100 hover:bg-blue-50/40 cursor-pointer"
                  >

                    {/* Row Checkbox */}
                    <td className="p-3 w-10">
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        aria-label={`Select ticket TKT-${ticketCode(t)}`}
                        onClick={function (e) {
                          e.stopPropagation();
                        }}
                      />
                    </td>

                    {/* Ticket ID */}
                    <td className="p-3 text-sm font-medium text-black">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: "#F97316",
                          }}
                        ></span>

                        TKT-{ticketCode(t)}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="p-3 text-sm text-gray-800">
                      {t.subject}
                    </td>

                    {/* Contact */}
                    <td className="p-3 text-sm">
                      <div className="text-gray-800">
                        {t.contact_name}
                      </div>

                      <div className="text-xs text-gray-400">
                        {t.user_email}
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: "#7C3AED",
                          }}
                        ></span>

                        {t.channel || "Bot"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      {t.status === "open" ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: "#2563EB" }}
                          ></span>
                          Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-300 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: "#6A7282",
                            }}
                          ></span>

                          Closed
                        </span>
                      )}
                    </td>

                    {/* Updated */}
                    <td className="p-3 text-sm text-gray-500">
                      {formatRelativeTime(t.updated_at)}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {tickets.length === 0 && (
            <p className="p-6 text-center text-gray-400 text-sm">
              No tickets found.
            </p>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-black">
                Create new ticket
              </h2>

              <button
                onClick={closeNewTicketModal}
                disabled={creatingTicket}
                className="text-gray-400 hover:text-gray-600 active:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-xl leading-none cursor-pointer transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">

              <div className="grid grid-cols-2 gap-4">

                {/* Contact Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Contact name *
                  </label>

                  <input
                    value={ntName}
                    onChange={function (e) {
                      setNtName(e.target.value);

                      if (e.target.value.trim()) {
                        setNtErrors(function (prev) {
                          return { ...prev, name: "" };
                        });
                      }
                      }}
                    placeholder="Enter the name"
                    className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      ntErrors.name
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {ntErrors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {ntErrors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Email *
                  </label>

                  <input
                    value={ntEmail}
                    onChange={function (e) {
                      setNtEmail(e.target.value);

                      if (e.target.value.trim()) {
                        setNtErrors(function (prev) {
                          return { ...prev, email: "" };
                       });
                      }
                      }}
                    placeholder="Enter your email"
                    className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      ntErrors.email
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {ntErrors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {ntErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Phone
                  </label>

                  <input
                    value={ntPhone}
                    onChange={function (e) {
                      setNtPhone(e.target.value);
                    }}
                    placeholder=""
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Channel */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Channel *
                  </label>

                  <select
          
                    value={ntChannel}
                    onChange={function (e) {
                      setNtChannel(e.target.value);

                    if (e.target.value.trim()) {
                      setNtErrors(function (prev) {
                        return { ...prev, channel: "" };
                      });
                    }
                  }}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option>Bot</option>
                    <option>Call Back</option>
                    <option>WhatsApp</option>
                    <option>Campaign</option>
                    <option>Contact Us</option>
                  </select>
                  {ntErrors.channel && (
                    <p className="text-xs text-red-500 mt-1">
                      {ntErrors.channel}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Company *
                  </label>

                  <input
                    value={ntCompany}
                    onChange={function (e) {
                      setNtCompany(e.target.value);

                      if (e.target.value.trim()) {
                        setNtErrors(function (prev) {
                          return { ...prev, company: "" };
                        });
                      }
                    }}
                    placeholder="Enter your company"
                    className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      ntErrors.company
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {ntErrors.company && (
                    <p className="text-xs text-red-500 mt-1">
                      {ntErrors.company}
                    </p>
                  )}
                </div>

                {/* Preferred Call Time */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Preferred call time
                  </label>

                  <input
                    value={ntCallTime}
                    onChange={function (e) {
                      setNtCallTime(e.target.value);
                    }}
                    placeholder="Tomorrow, 11:00 IST"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Priority Full Width */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Priority *
                  </label>

                  <select
                    value={ntPriority}
                    onChange={function (e) {
                      setNtPriority(e.target.value);

                      if (e.target.value.trim()) {
                        setNtErrors(function (prev) {
                          return { ...prev, priority: "" };
                       });
                      }
                    }}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                  {ntErrors.priority && (
                    <p className="text-xs text-red-500 mt-1">
                      {ntErrors.priority}
                    </p>
                  )}
                </div>

              </div>

              {/* Description Full Width */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Description
                </label>

                <textarea
                  value={ntDescription}
                  onChange={function (e) {
                    setNtDescription(e.target.value);
                  }}
                  placeholder="What's this about?"
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">

              <button
                onClick={closeNewTicketModal}
                disabled={creatingTicket}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:ring-2 focus:ring-gray-200 text-sm font-semibold text-black cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateTicket}
                disabled={creatingTicket}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-300 text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                <span className="text-base leading-none">
                  +
                </span>

                {creatingTicket
                  ? "Creating..."
                  : "Create ticket"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}