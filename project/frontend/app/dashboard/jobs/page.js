"use client";

import { useEffect, useState } from "react";
import { api, session } from "../../../lib/api";

export default function JobsPage() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobQuery, setJobQuery] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobTypeFilters, setJobTypeFilters] = useState([]);
  const [jobTypeExpanded, setJobTypeExpanded] = useState(true);
  const [appliedSearch, setAppliedSearch] = useState(false);
  const [teaserOrgs, setTeaserOrgs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [error, setError] = useState("");

  useEffect(function () {
    setUser(session.getUser());
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const data = await api.listJobs(jobQuery, jobLocation);
      setJobs(data);
      const uniqueOrgs = Array.from(new Set(data.map(function (job) { return job.organization; })));
      const shuffled = uniqueOrgs
        .map(function (name) { return { name: name, sort: Math.random() }; })
        .sort(function (a, b) { return a.sort - b.sort; })
        .map(function (item) { return item.name; })
        .slice(0, 8);
      setTeaserOrgs(shuffled);
    } catch (err) {
      setError(err.message);
    } finally {
      setJobsLoading(false);
    }
  }

  function handleJobSearch(e) {
    e.preventDefault();
    setAppliedSearch(true);
    loadJobs();
  }

  function toggleJobTypeFilter(type) {
    setAppliedSearch(true);
    setJobTypeFilters(function (prev) {
      return prev.includes(type) ? prev.filter(function (t) { return t !== type; }) : prev.concat([type]);
    });
  }

  const visibleJobs = jobTypeFilters.length === 0
    ? jobs
    : jobs.filter(function (job) { return jobTypeFilters.includes(job.job_type); });

  const filtersActive = appliedSearch || jobTypeFilters.length > 0;

  if (!user) return null;

  return (
    <div>
      {error && <div className="px-8 py-2.5 text-red-500 text-sm">{error}</div>}
      <div className="px-8 py-4 bg-white border-b border-gray-100">
        <h1 className="text-lg font-bold mb-2.5">Hi, {user.name}</h1>
        <form onSubmit={handleJobSearch} className="flex gap-2 max-w-2xl">
          <input
            placeholder="Search by job title"
            value={jobQuery}
            onChange={function (e) { setJobQuery(e.target.value); }}
            className="flex-[2] px-3 py-2.5 rounded-lg border border-gray-300"
          />
          <input
            placeholder="Location"
            value={jobLocation}
            onChange={function (e) { setJobLocation(e.target.value); }}
            className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300"
          />
          <button type="submit" className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-5 rounded-lg font-bold">
            Search
          </button>
        </form>
      </div>

      <div className="flex items-start">
        <div className="w-[260px] min-w-[260px] min-h-[70vh] bg-blue-50 border border-gray-100 rounded-xl p-5 my-6 ml-8 box-border">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-[15px]">Filters</span>
            {jobTypeFilters.length > 0 && (
              <span onClick={function () { setJobTypeFilters([]); }} className="text-xs text-blue-600 cursor-pointer">
                Clear all
              </span>
            )}
          </div>

          <div
            onClick={function () { setJobTypeExpanded(function (v) { return !v; }); }}
            className="flex justify-between items-center font-semibold text-sm mb-3 cursor-pointer select-none"
          >
            <span>Job Type{jobTypeFilters.length > 0 ? ` (${jobTypeFilters.length})` : ""}</span>
            <span className="text-gray-400 text-xs">{jobTypeExpanded ? "▲" : "▼"}</span>
          </div>

          {jobTypeExpanded && (
            <div>
              {["Full Time", "Part Time", "Contract"].map(function (type) {
                return (
                  <label key={type} className="flex items-center gap-2.5 text-sm mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={jobTypeFilters.includes(type)}
                      onChange={function () { toggleJobTypeFilter(type); }}
                      className="w-4 h-4 shrink-0"
                    />
                    <span className="whitespace-nowrap">{type}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 px-8 py-6">
          {!filtersActive && (
            <div>
              <h2 className="text-base mb-3 text-gray-500">Hospitals hiring right now</h2>
              <p className="text-sm text-gray-400 mb-4 max-w-md">
                Search a job title, a location, or pick a Job Type filter on the left to see open roles.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {teaserOrgs.map(function (name) {
                  return (
                    <div key={name} className="bg-white border border-gray-100 rounded-full px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm">
                      {name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filtersActive && (
            <div>
              <h2 className="text-base mb-4 text-gray-500">
                {jobsLoading ? "Loading..." : `${visibleJobs.length} job${visibleJobs.length === 1 ? "" : "s"} found`}
              </h2>
              {!jobsLoading && visibleJobs.length === 0 && <p>No jobs found.</p>}
              <div className="flex flex-col gap-3">
                {visibleJobs.map(function (job) {
                  const alreadyApplied = appliedJobIds.includes(job.id);
                  return (
                    <div key={job.id} className="flex justify-between items-start bg-white border border-gray-100 rounded-xl p-4.5 shadow-sm">
                      <div>
                        <div className="font-bold text-base">{job.title}</div>
                        <div className="text-gray-600 text-sm mb-1.5">{job.organization}</div>
                        <div className="text-xs text-gray-400 mb-1.5">
                          {job.job_type} · {job.location} {job.salary ? `· ${job.salary}` : ""}
                        </div>
                        <div className="text-xs text-gray-700 max-w-lg">{job.description}</div>
                      </div>
                      <button
                        onClick={function () {
                          setAppliedJobIds(function (prev) {
                            return prev.includes(job.id) ? prev : prev.concat([job.id]);
                          });
                        }}
                        disabled={alreadyApplied}
                        className={`px-4.5 py-2 rounded-lg font-bold text-xs whitespace-nowrap ${
                          alreadyApplied ? "bg-gray-200 text-gray-500" : "bg-gradient-to-r from-blue-600 to-teal-500 text-white"
                        }`}
                      >
                        {alreadyApplied ? "Applied" : "Apply"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}