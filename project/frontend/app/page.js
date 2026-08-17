"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function HomePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await api.listJobs(q, location);
      setJobs(data);
    } catch (err) {
      // ignore for the demo
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    loadJobs();
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid #dddddd",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: 20 }}>Healthcare Portal</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span>Jobs</span>
          <span>About Us</span>
          <span>Contact Us</span>
          <button onClick={() => router.push("/login")} style={{ background: "#00e676" }}>
            Login
          </button>
          <button onClick={() => router.push("/login")}>Sign Up</button>
        </div>
      </div>

      <div style={{ padding: "40px 32px", borderBottom: "1px solid #dddddd" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Discover Healthcare Jobs</h1>
        <p style={{ color: "#555555", marginBottom: 20 }}>
          Openings across hospitals, clinics, and healthcare organizations.
        </p>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, maxWidth: 700 }}>
          <input
            placeholder="Search by job title"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 2 }}
          />
          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" style={{ background: "#00e676" }}>
            Search
          </button>
        </form>
      </div>

      <div style={{ padding: "24px 32px" }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Explore Healthcare Jobs</h1>

        {loading && <p>Loading jobs...</p>}
        {!loading && jobs.length === 0 && <p>No jobs found.</p>}

        {jobs.map(function (job) {
          return (
            <div key={job.id} className="faq-item" style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: "bold", fontSize: 16 }}>{job.title}</div>
              <div style={{ color: "#555555", fontSize: 14 }}>{job.organization}</div>
              <div style={{ fontSize: 13, color: "#777777", margin: "6px 0" }}>
                {job.job_type} · {job.location} {job.salary ? `· ${job.salary}` : ""}
              </div>
              <div style={{ fontSize: 13 }}>{job.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}