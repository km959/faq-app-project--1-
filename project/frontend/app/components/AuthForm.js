"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, session } from "../../lib/api";
import LoginChatbot from "./LoginChatbot";

function isValidPhone(value) {
  if (!value) return true;
  return /^[0-9+\-\s()]+$/.test(value);
}

function isValidName(value) {
  if (!value) return true;
  return /^[a-zA-Z\s]+$/.test(value);
}

export default function AuthForm({ mode }) {
  const router = useRouter();

  const [role, setRole] = useState(
    mode === "login" ? "user" : "candidate"
  );

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(e) {
    const value = e.target.value;

    setName(value);
    setNameError(isValidName(value) ? "" : "Letters only.");
  }

  function handlePhoneChange(e) {
    const value = e.target.value;

    setPhone(value);
    setPhoneError(isValidPhone(value) ? "" : "Numbers only.");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "register" && name && !isValidName(name)) {
      setNameError("Letters only.");
      setError("Please enter a valid name.");
      return;
    }

    if (mode === "register" && phone && !isValidPhone(phone)) {
      setPhoneError("Numbers only.");
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      const data =
        mode === "login"
          ? await api.login(email, password, role)
          : await api.register(
              email,
              password,
              name,
              phone,
              role
            );

      session.setSession(data.access_token, data.user);

      router.push(
        data.user.role === "admin"
          ? "/admin"
          : "/dashboard/jobs"
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-lg">
        <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
          {mode === "login" ? "Log In" : "Sign Up"}
        </h1>

        <label className="text-sm text-gray-700">
          {mode === "login" ? "Log in as" : "Sign up as"}
        </label>

        <div className="flex gap-2 mb-4 mt-1">
          {mode === "login" ? (
            <>
              <button
                type="button"
                onClick={function () {
                  setRole("user");
                }}
                className={`flex-1 py-2.5 rounded-lg font-semibold ${
                  role === "user"
                    ? "text-white bg-gradient-to-r from-blue-600 to-teal-500"
                    : "bg-gray-100 text-black"
                }`}
              >
                User
              </button>

              <button
                type="button"
                onClick={function () {
                  setRole("admin");
                }}
                className={`flex-1 py-2.5 rounded-lg font-semibold ${
                  role === "admin"
                    ? "text-white bg-gradient-to-r from-blue-600 to-teal-500"
                    : "bg-gray-100 text-black"
                }`}
              >
                Admin
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={function () {
                  setRole("candidate");
                }}
                className={`flex-1 py-2.5 rounded-lg font-semibold ${
                  role === "candidate"
                    ? "text-white bg-gradient-to-r from-blue-600 to-teal-500"
                    : "bg-gray-100 text-black"
                }`}
              >
                Candidate
              </button>

              <button
                type="button"
                onClick={function () {
                  setRole("organization");
                }}
                className={`flex-1 py-2.5 rounded-lg font-semibold ${
                  role === "organization"
                    ? "text-white bg-gradient-to-r from-blue-600 to-teal-500"
                    : "bg-gray-100 text-black"
                }`}
              >
                Organization
              </button>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label className="text-sm text-gray-700">
                Name
              </label>

              <input
                value={name}
                onChange={handleNameChange}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm mb-1"
              />

              {nameError && (
                <div className="text-red-500 text-xs mb-3">
                  {nameError}
                </div>
              )}

              {!nameError && <div className="mb-3" />}

              <label className="text-sm text-gray-700">
                Phone
              </label>

              <input
                value={phone}
                onChange={handlePhoneChange}
                required
                type="tel"
                inputMode="numeric"
                pattern="[0-9+\-\s()]*"
                placeholder="e.g. 9876543210"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm mb-1"
              />

              {phoneError && (
                <div className="text-red-500 text-xs mb-3">
                  {phoneError}
                </div>
              )}

              {!phoneError && <div className="mb-3" />}
            </>
          )}

          <label className="text-sm text-gray-700">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={function (e) {
              setEmail(e.target.value);
            }}
            required
            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />

          <label className="text-sm text-gray-700">
            Password
          </label>

          <div className="relative mt-1 mb-3">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={function (e) {
                setPassword(e.target.value);
              }}
              required
              minLength={6}
              className="w-full px-3 py-2 pr-11 border border-gray-300 rounded-lg text-sm"
            />

            <button
              type="button"
              onClick={function () {
                setShowPassword(function (v) {
                  return !v;
                });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!phoneError || !!nameError}
            className="w-full py-3 rounded-lg text-white font-bold bg-gradient-to-r from-blue-600 to-teal-500 disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Log In"
              : "Sign Up"}
          </button>
        </form>

        <div className="text-center mt-3 text-sm">
          <Link
            href={mode === "login" ? "/signup" : "/login"}
            className="cursor-pointer text-blue-600"
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </Link>
        </div>
      </div>

      {mode === "login" && <LoginChatbot />}
    </div>
  );
}