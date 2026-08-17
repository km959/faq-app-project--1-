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
    <div className="container">
      <h1>View Profile</h1>

      <label>Name</label>
      <input value={user.name || ""} readOnly />

      <label>Email</label>
      <input value={user.email || ""} readOnly />

      <label>Phone</label>
      <input value={user.phone || ""} readOnly />

      <button onClick={() => router.push("/dashboard")} style={{ marginTop: 16, width: "100%" }}>
        Back
      </button>
    </div>
  );
}