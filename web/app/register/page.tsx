"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, CreditCard, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // BAGONG STATE PARA SA SUCCESS POPUP
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Strength States
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("");
  const [strengthColor, setStrengthColor] = useState("bg-slate-200");
  
  const [reqs, setReqs] = useState({
    length: false,
    upper: false,
    number: false,
    special: false
  });

  const [formData, setFormData] = useState({
    schoolId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Evaluate password strength whenever password changes
  useEffect(() => {
    const pwd = formData.password;
    
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    setReqs({ length: hasLength, upper: hasUpper, number: hasNumber, special: hasSpecial });

    let score = 0;
    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    setPasswordStrength(score);

    if (pwd.length === 0) {
      setStrengthLabel("");
      setStrengthColor("bg-slate-200");
    } else if (score <= 1) {
      setStrengthLabel("Weak");
      setStrengthColor("bg-rose-500");
    } else if (score === 2) {
      setStrengthLabel("Moderate");
      setStrengthColor("bg-orange-500");
    } else if (score === 3) {
      setStrengthLabel("Strong");
      setStrengthColor("bg-emerald-500");
    } else if (score === 4) {
      setStrengthLabel("Very Strong");
      setStrengthColor("bg-green-600");
    }
  }, [formData.password]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when typing
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (passwordStrength < 4) {
      setError("Please create a 'Very Strong' password by meeting all requirements.");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: formData.schoolId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // I-trigger ang paglabas ng Popup Modal
      setShowSuccessPopup(true);
      
      // Auto-redirect to login after 5 seconds
      setTimeout(() => {
        router.push("/login");
      }, 5000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      
      {/* ===================== SUCCESS POPUP MODAL ===================== */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-8 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mb-5 bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to CLINNOVATE! 🎉</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Thank you for registering your account, <b className="text-slate-700">{formData.firstName}</b>! You can now login to access the school clinic portal.
            </p>
            
            <Button onClick={() => router.push("/login")} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 flex items-center justify-center gap-2 font-bold text-base transition-colors">
              Proceed to Login <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="text-xs text-slate-400 mt-4 animate-pulse">Redirecting automatically in a few seconds...</p>
          </div>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-blue-100 text-sm mt-1">Register for the CLINNOVATE</p>
        </div>

        <div className="p-6 sm:p-8">
          
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">School ID</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input required type="text" name="schoolId" value={formData.schoolId} onChange={handleChange} placeholder="e.g. 2024-12345" className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Juan" className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Dela Cruz" className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="student@school.edu.ph" className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* PASSWORD FIELD WITH TOGGLE */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* STRENGTH METER */}
                {formData.password.length > 0 && (
                  <div className="mt-2 space-y-2 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">Password Strength:</span>
                      <span className={
                        passwordStrength <= 1 ? "text-rose-500" :
                        passwordStrength === 2 ? "text-orange-500" :
                        passwordStrength === 3 ? "text-emerald-500" :
                        "text-green-600"
                      }>{strengthLabel}</span>
                    </div>
                    <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${passwordStrength >= 1 ? strengthColor : 'bg-transparent'} w-1/4 rounded-full`}></div>
                      <div className={`h-full transition-all duration-300 ${passwordStrength >= 2 ? strengthColor : 'bg-transparent'} w-1/4 rounded-full`}></div>
                      <div className={`h-full transition-all duration-300 ${passwordStrength >= 3 ? strengthColor : 'bg-transparent'} w-1/4 rounded-full`}></div>
                      <div className={`h-full transition-all duration-300 ${passwordStrength >= 4 ? strengthColor : 'bg-transparent'} w-1/4 rounded-full`}></div>
                    </div>
                    
                    {/* REQUIREMENTS CHECKLIST */}
                    <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-500 mt-2">
                      <div className={`flex items-center gap-1.5 ${reqs.length ? 'text-green-600 font-medium' : ''}`}>
                        {reqs.length ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-50" />} Min 8 characters
                      </div>
                      <div className={`flex items-center gap-1.5 ${reqs.upper ? 'text-green-600 font-medium' : ''}`}>
                        {reqs.upper ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-50" />} 1 Uppercase letter
                      </div>
                      <div className={`flex items-center gap-1.5 ${reqs.number ? 'text-green-600 font-medium' : ''}`}>
                        {reqs.number ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-50" />} 1 Number
                      </div>
                      <div className={`flex items-center gap-1.5 ${reqs.special ? 'text-green-600 font-medium' : ''}`}>
                        {reqs.special ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-50" />} 1 Special symbol
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD WITH TOGGLE */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    required 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading || passwordStrength < 4} className={`w-full text-white py-2.5 rounded-lg font-bold mt-4 transition-all ${passwordStrength < 4 && formData.password.length > 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : "Create Account"}
            </Button>
          </form>

        </div>

        {/* Footer Link */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-sm">
          <span className="text-slate-500">Already have an account? </span>
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Login here
          </Link>
        </div>

      </div>
    </div>
  );
}