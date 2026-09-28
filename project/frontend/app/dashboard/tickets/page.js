"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, session } from "../../../lib/api";

export default function MyTicketsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function () {
    const token = session.getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setUser(session.getUser());
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTickets() {
    try {
      const data = await api.listMyTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user || loading) {
    return (
      <div className="w-full px-8 py-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-8 py-6">
        <Link href="/dashboard/jobs" className="text-sm text-black underline">
          Back to Jobs
        </Link>
        <h1 className="text-xl font-semibold text-black mt-3 mb-4">My Tickets</h1>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {tickets.length === 0 && (
            <p className="p-6 text-center text-gray-400 text-sm">You haven't raised any tickets yet.</p>
          )}
          {tickets.map(function (t) {
            return (
              <div key={t.id} className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-black">{t.subject}</span>
                  <span
                    className={
                      t.status === "open"
                        ? "text-xs font-semibold text-blue-700"
                        : "text-xs font-semibold text-gray-500"
                    }
                  >
                    {t.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{t.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}