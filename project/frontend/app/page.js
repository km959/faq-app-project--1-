"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(function () {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const data = await api.listJobs(q, location);
      setJobs(data);
    } catch (err) {
      // ignore for the demo
    } finally {
      setJobsLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    loadJobs();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <div className="font-bold text-xl">Healthcare Portal</div>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer">Jobs</span>
          <span className="cursor-pointer">About Us</span>
          <span className="cursor-pointer">Contact Us</span>
          <button
            onClick={function () { router.push("/login"); }}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold"
          >
            Login
          </button>
          <button
            onClick={function () { router.push("/signup"); }}
            className="bg-white/20 border border-white text-white px-4 py-2 rounded-lg font-bold"
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className="px-8 py-10 bg-white border-b border-gray-200">
        <h1 className="text-3xl font-bold mb-2">Discover Healthcare Jobs</h1>
        <p className="text-gray-600 mb-5">Openings across hospitals, clinics, and healthcare organizations.</p>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <input
            placeholder="Search by job title"
            value={q}
            onChange={function (e) { setQ(e.target.value); }}
            className="flex-[2] px-3 py-2.5 rounded-lg border border-gray-300"
          />
          <input
            placeholder="Location"
            value={location}
            onChange={function (e) { setLocation(e.target.value); }}
            className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 rounded-lg font-bold"
          >
            Search
          </button>
        </form>
      </div>

      <div className="px-8 py-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Explore Healthcare Jobs</h2>

        {jobsLoading && <p>Loading jobs...</p>}
        {!jobsLoading && jobs.length === 0 && <p>No jobs found.</p>}

        <div className="flex flex-col gap-3">
          {jobs.map(function (job) {
            return (
              <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="font-bold text-base">{job.title}</div>
                <div className="text-gray-600 text-sm mb-1.5">{job.organization}</div>
                <div className="text-xs text-gray-500 mb-1.5">
                  {job.job_type} · {job.location} {job.salary ? `· ${job.salary}` : ""}
                </div>
                <div className="text-sm text-gray-700">{job.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}