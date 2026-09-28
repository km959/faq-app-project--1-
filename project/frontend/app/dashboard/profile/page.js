"use client";

import { useEffect, useState } from "react";
import { session } from "../../../lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(function () {
    setUser(session.getUser());
  }, []);

  if (!user) return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="bg-white border border-gray-100 rounded-xl p-5 max-w-md">
        <p className="text-sm mb-2"><strong>Name:</strong> {user.name}</p>
        <p className="text-sm mb-2"><strong>Email:</strong> {user.email}</p>
        <p className="text-sm"><strong>Phone:</strong> {user.phone}</p>
      </div>
    </div>
  );
}