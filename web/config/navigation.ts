import {
  LayoutDashboard, Users, Activity, Calendar, Stethoscope, 
  FileText, History, Pill, Package, AlertTriangle, 
  BarChart3, Megaphone, ShieldAlert, Settings, User, 
  Bell, FileQuestion, HeartPulse, FileCheck, UserCog 
} from "lucide-react";

// 👇 BAGONG DAGDAG PARA SA ADMIN MENU 👇
export const ADMIN_NAV = [
  { title: "User Management", href: "/admin/users", icon: Users },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
];
// 👆 =================================== 👆

export const NURSE_NAV = [
  { title: "Dashboard", href: "/nurse/dashboard", icon: LayoutDashboard },
  { title: "Students", href: "/nurse/students", icon: Users },
  
  // BAGONG DAGDAG PARA SA STUDENT PROFILE REQUESTS:
  { title: "Profile Requests", href: "/nurse/profile-requests", icon: UserCog },
  
  { title: "Clinic Visits", href: "/nurse/clinic-visits", icon: Activity },
  // Tinanggal na natin ang Appointments dito!
  { title: "Referrals", href: "/nurse/referrals", icon: Stethoscope },
  
  // BAGONG DAGDAG PARA SA NURSE:
  { title: "Clearances", href: "/nurse/clinic-requests", icon: FileCheck }, 
  
  { title: "Health Records", href: "/nurse/health-records", icon: FileText },
  { title: "Medical History", href: "/nurse/medical-history", icon: History },
  { title: "Medications", href: "/nurse/medications", icon: Pill },
  { title: "Inventory", href: "/nurse/inventory", icon: Package },
  { title: "Emergency Incidents", href: "/nurse/emergency-incidents", icon: AlertTriangle },
  { title: "Reports", href: "/nurse/reports", icon: BarChart3 },
  { title: "Analytics", href: "/nurse/analytics", icon: Activity },
  { title: "Announcements", href: "/nurse/announcements", icon: Megaphone },
  { title: "Audit Logs", href: "/nurse/audit-logs", icon: ShieldAlert },
  { title: "Settings", href: "/nurse/settings", icon: Settings },
];

export const HEAD_TEACHER_NAV = [
  { title: "Dashboard", href: "/head-teacher/dashboard", icon: LayoutDashboard },
  { title: "My Students", href: "/head-teacher/students", icon: Users },
  { title: "Referrals", href: "/head-teacher/referrals", icon: Stethoscope },
  { title: "Clinic Requests", href: "/head-teacher/clinic-requests", icon: FileQuestion },
  { title: "Announcements", href: "/head-teacher/announcements", icon: Megaphone },
  { title: "Notifications", href: "/head-teacher/notifications", icon: Bell },
  { title: "Settings", href: "/head-teacher/settings", icon: Settings },
];

export const STUDENT_NAV = [
  { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { title: "My Health", href: "/student/health", icon: HeartPulse },
  { title: "Clinic Visits", href: "/student/clinic-visits", icon: Activity },
  { title: "Appointments", href: "/student/appointments", icon: Calendar },
  { title: "Request Clinic Visit", href: "/student/request-visit", icon: FileQuestion },
  { title: "Announcements", href: "/student/announcements", icon: Megaphone },
  { title: "Notifications", href: "/student/notifications", icon: Bell },
  { title: "Settings", href: "/student/settings", icon: Settings },
];

export const getNavByRole = (role: string | null) => {
  switch (role) {
    case "ADMIN": return ADMIN_NAV; // 👈 DINAGDAG NATIN ITO
    case "NURSE": return NURSE_NAV;
    case "HEAD_TEACHER": return HEAD_TEACHER_NAV;
    case "STUDENT": return STUDENT_NAV;
    default: return [];
  }
};