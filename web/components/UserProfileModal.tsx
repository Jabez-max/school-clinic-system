"use client";

import React, { useEffect, useState } from "react";
import { X, Mail, IdCard, BadgeCheck, ShieldAlert, BookOpen, Edit } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; 

// 👇 I-import ang Modal na ginawa natin kanina
import ProfileUpdateModal from "./ProfileUpdateModal"; 

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 👇 Bagong state para ma-control kung open ba ang Update Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false); 
  
  const { role } = useAuth(); 

  useEffect(() => {
    if (isOpen && role) {
      fetchProfile();
    }
  }, [isOpen, role]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // 👇 INAYOS: Ginamit na natin ang Vercel/Render API URL imbes na localhost
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let endpoint = `${baseUrl}/api/nurse/profile`; 
      
      if (role === "HEAD_TEACHER") {
        endpoint = `${baseUrl}/api/head-teacher/settings`;
      } else if (role === "STUDENT") {
        endpoint = `${baseUrl}/api/student/profile`;
      }

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) setProfile(json.profile || json.user || json); // Pinasimple para kahit ano ireturn ng backend, makuha niya
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 👇 SAFETY CHECK: Kumuha ng tamang initial mula sa profile
  const getInitial = () => {
    if (profile && profile.firstName) return profile.firstName.charAt(0).toUpperCase();
    if (profile && profile.name) return profile.name.charAt(0).toUpperCase(); // Para minsan name ang binabato
    return "U";
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
          
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 p-1.5 bg-black/10 hover:bg-black/20 rounded-full z-10 transition text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header Cover */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

          <div className="px-6 pb-6 relative">
            
            {/* Avatar & Active Badge */}
            <div className="flex justify-between items-end -mt-10 mb-4">
              <div className="h-20 w-20 bg-white rounded-full p-1 shadow-md">
                <div className="h-full w-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {/* 👇 Ginamit ang ligtas na function para sa Initial */}
                  {getInitial()}
                </div>
              </div>
              {profile && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-wider rounded-full border border-emerald-200 mb-2">
                  <BadgeCheck className="h-3 w-3" /> Active
                </div>
              )}
            </div>

            {/* Loading Skeleton */}
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-6"></div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
              </div>
            ) : profile ? (
              <div className="space-y-5">
                
                {/* Name & Role */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {profile.firstName ? `${profile.firstName} ${profile.lastName || ''}` : (profile.name || 'Student')}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium capitalize mt-0.5">
                    {(profile.role || role || 'STUDENT').replace('_', ' ').toLowerCase()}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Email Address */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                      <p className="text-sm font-medium text-slate-800">{profile.email}</p>
                    </div>
                  </div>

                  {/* DYNAMIC DETAILS: Depende sa Role */}
                  {role === 'HEAD_TEACHER' ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Assigned Section</p>
                        <p className="text-sm font-bold text-emerald-800">
                          {profile.handledGrade && profile.handledSection 
                            ? `${profile.handledGrade} - ${profile.handledSection}` 
                            : "Unassigned"}
                        </p>
                      </div>
                    </div>
                  ) : role === 'STUDENT' ? (
                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500">
                        <IdCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-wider">Student ID & Section</p>
                        <p className="text-sm font-bold text-indigo-800">
                          {profile.schoolId || "TBD"} - {profile.gradeLevel || "TBD"} {profile.section || "TBD"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500">
                        <IdCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider">PRC License / Staff ID</p>
                        <p className="text-sm font-bold text-blue-800">
                          {profile.schoolId || "Unassigned"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 👇 BAGONG SECTION: Lalabas lamang kapag STUDENT ang naka-login */}
                {role === 'STUDENT' && (
                  <button 
                    onClick={() => setIsUpdateModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Request Profile Update
                  </button>
                )}

                {/* Security Note */}
                <div className="flex items-start gap-2 pt-2 text-slate-400 text-xs">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <p>To update your account settings or password, please proceed to the Settings module.</p>
                </div>

              </div>
            ) : (
              <p className="text-center text-slate-500 text-sm py-4">Failed to load profile. Please try reloading the page.</p>
            )}
          </div>
        </div>
      </div>

      {/* 👇 I-RENDER ANG UPDATE MODAL KAPAG CLINICK ANG BUTTON */}
      <ProfileUpdateModal 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
      />
    </>
  );
}