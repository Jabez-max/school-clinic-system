"use client";

import { useState, useEffect } from "react";
import { GoogleLogin } from '@react-oauth/google';
import Link from "next/link"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // =================================================================
  // ANTI-LOOP AUTO-REDIRECT (HARD RELOAD) 🛡️
  // =================================================================
  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    const verifySessionAndRedirect = async () => {
      if (!token || !userStr) return;

      try {
        // 👇 BINAGO: Gumagamit na ng Environment Variable
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const user = JSON.parse(userStr);
          const role = user.role?.toUpperCase();
          
          if (role === "HEAD_TEACHER") window.location.href = "/head-teacher/dashboard";
          else if (role === "NURSE") window.location.href = "/nurse/dashboard";
          else if (role === "STUDENT") window.location.href = "/student/dashboard";
        } else {
          throw new Error("Invalid session");
        }
      } catch (err) {
        console.warn("Session rejected by server. Clearing storage to break loop.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie = "clinic_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    };

    verifySessionAndRedirect();
  }, []);

  // =================================================================
  // 1. STANDARD LOGIN (EMAIL/ID + PASSWORD)
  // =================================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 👇 BINAGO: Gumagamit na ng Environment Variable
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please check your credentials.");
      }

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        document.cookie = `clinic_session=${data.token}; path=/; max-age=86400; SameSite=Strict`;

        const userRole = (data.role || data.user?.role)?.toUpperCase();

        if (userRole === "NURSE") window.location.href = "/nurse/dashboard";
        else if (userRole === "HEAD_TEACHER") window.location.href = "/head-teacher/dashboard";
        else if (userRole === "STUDENT") window.location.href = "/student/dashboard";
        else throw new Error("Login successful, but role is invalid or missing.");
      } else {
         throw new Error("Missing token or user data from server.");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false); 
    }
  };

  // =================================================================
  // 2. GOOGLE LOGIN HANDLER 🚀
  // =================================================================
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(""); 
    setLoading(true);

    try {
      // 👇 BINAGO: Gumagamit na ng Environment Variable
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Google Authentication failed.");
      }

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        document.cookie = `clinic_session=${data.token}; path=/; max-age=86400; SameSite=Strict`;

        const userRole = (data.role || data.user?.role)?.toUpperCase();

        if (userRole === "NURSE") window.location.href = "/nurse/dashboard";
        else if (userRole === "HEAD_TEACHER") window.location.href = "/head-teacher/dashboard";
        else if (userRole === "STUDENT") window.location.href = "/student/dashboard";
        else window.location.href = "/student/dashboard"; 
      } else {
        throw new Error("Missing token or user data from server.");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!isMounted) return null; 

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center mb-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-slate-800">CLINNOVATE</h2>
          <p className="text-slate-500 text-sm mt-1">A Clinical-Based System for School Clinic Record & Management</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5" autoComplete="off" suppressHydrationWarning>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="email">
             Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="off" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              placeholder="Username or Email"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all pr-10"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Secure Login"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 w-full">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs text-slate-500 font-medium tracking-wider">OR LOGIN WITH</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError("Google Login failed or was cancelled.");
                setLoading(false);
              }}
              theme="outline"
              size="large"
              text="continue_with"
            />
          </div>
        </div>

        {/* 👇 IDINAGDAG: REGISTRATION LINK 👇 */}
        <div className="text-center mt-6 text-sm text-slate-500">
          Don't have an account yet?{' '}
          <Link href="/register" className="text-blue-600 font-bold hover:underline">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
}