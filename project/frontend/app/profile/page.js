"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { session } from "../../lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(function () {
    const token = session.getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setUser(session.getUser());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-teal-50">
      <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-lg">
        <h1 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
          View Profile
        </h1>

        <label className="text-sm text-gray-600">Name</label>
        <input value={user.name || ""} readOnly className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />

        <label className="text-sm text-gray-600">Email</label>
        <input value={user.email || ""} readOnly className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />

        <label className="text-sm text-gray-600">Phone</label>
        <input value={user.phone || ""} readOnly className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />

        <button
          onClick={function () { router.push("/dashboard"); }}
          className="w-full py-2.5 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-teal-500"
        >
          Back
        </button>
      </div>
    </div>
  );
}