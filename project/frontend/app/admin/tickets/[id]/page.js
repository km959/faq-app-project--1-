"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, session } from "../../../../lib/api";
import { formatRelativeTime } from "../../../../lib/format";

function StatusBadge({ status }) {
  const isOpen =
    String(status).toLowerCase() === "open";

  return (
    <span
      className={
        isOpen
          ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700"
          : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-600"
      }
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor: isOpen
            ? "#1447E6"
            : "#6A7282",
        }}
      />

      {isOpen ? "Open" : "Closed"}
    </span>
  );
}

function displaySubject(subject) {
  if (
    !subject ||
    String(subject)
      .toLowerCase()
      .includes("auto-raised")
  ) {
    return "Support Ticket";
  }

  return subject;
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();

  const shortCode = String(params.id)
    .replace(/^TKT-/i, "")
    .toUpperCase();

  const [user, setUser] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(function () {
    const token = session.getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const currentUser = session.getUser();

    if (
      !currentUser ||
      currentUser.role !== "admin"
    ) {
      router.replace("/dashboard/jobs");
      return;
    }

    setUser(currentUser);
    loadTicket();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTicket() {
    setError("");

    try {
      const data =
        await api.getTicketByCode(shortCode);

      setTicket(data);
      setRemark(data.admin_remark || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(
    function () {
      const interval = setInterval(
        loadTicket,
        60000
      );

      return function () {
        clearInterval(interval);
      };

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [shortCode]
  );

  async function handleToggleStatus() {
    if (!ticket) return;

    const newStatus =
      String(ticket.status).toLowerCase() ===
      "open"
        ? "closed"
        : "open";

    setSaving(true);

    try {
      await api.updateTicketStatus(
        ticket.id,
        newStatus
      );

      await loadTicket();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    session.clearSession();
    router.replace("/login");
  }

  if (!user || loading) {
    return (
      <div className="max-w-3xl mx-auto mt-10 px-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto mt-10 px-4">
        <p className="text-red-500">
          {error || "Ticket not found."}
        </p>
      </div>
    );
  }

  const isOpen =
    String(ticket.status).toLowerCase() ===
    "open";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="font-bold text-xl">
          Healthcare Portal — Admin
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="bg-white/20 border-none text-white px-3.5 py-2 rounded-lg text-sm font-semibold"
        >
          Log Out
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-6">
        <Link
          href="/admin"
          className="text-sm text-black hover:underline"
        >
          Back to All Tickets
        </Link>

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-blue-800">
              TKT-{String(ticket.ticket_number).padStart(4, "0")}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {displaySubject(ticket.subject)}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Updated{" "}
              {formatRelativeTime(
                ticket.updated_at
              )}
            </p>
          </div>

          <StatusBadge status={ticket.status} />
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg border border-blue-100 p-4 mb-5">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Description
          </div>

          <div className="text-sm text-gray-800">
            {ticket.description}
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : isOpen
            ? "Mark Closed"
            : "Reopen"}
        </button>

       {ticket.status === "open" && (
         <div className="mt-5 rounded-lg border border-blue-200 bg-white p-4">
           <div className="font-semibold text-blue-700 mb-2">Admin Remark</div>
           <textarea
             value={remark}
             onChange={function (e) { setRemark(e.target.value); }}
             placeholder="Enter a remark for this user..."
             className="w-full rounded-md border border-gray-300 p-2 text-sm"
             rows={3}
            />
           <button
             onClick={async function () {
               await api.updateTicketStatus(ticket.id, ticket.status, remark);
               loadTicket();
             }}
             className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
             Save Remark
           </button>
        </div>
      )} 
      </div>
    </div>
  );
}