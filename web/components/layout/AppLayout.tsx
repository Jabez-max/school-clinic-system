"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getNavByRole } from "@/config/navigation";
// 👇 IMPORT NG SUN AT MOON ICONS 👇
import { Menu, Search, User as UserIcon, LogOut, Sun, Moon } from "lucide-react";
// 👇 IMPORT NG USE THEME 👇
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import UserProfileModal from "@/components/UserProfileModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // 👇 HOOK PARA SA THEME 👇
  const { theme, setTheme } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-blue-200 dark:bg-blue-900 mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading Medical Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null; 

  const navigation = role ? getNavByRole(role) : [];

  const searchResults = navigation.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="space-y-1 mt-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive 
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`}
          >
            <item.icon className={`h-5 w-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 fixed h-full z-10 transition-colors duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">+</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">CLINNOVATE</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">School Clinic Management</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <NavLinks />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-slate-600 dark:text-slate-300">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Main application navigation menu</SheetDescription>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">+</span>
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">CLINNOVATE</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">School Clinic Management</p>
                  </div>
                </div>
                <div className="p-3 overflow-y-auto h-[calc(100vh-70px)]">
                  <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
                {pathname.split("/").filter(Boolean).join(" / ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* GLOBAL SEARCH BAR */}
            <div className="relative hidden sm:block">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isSearchFocused ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} 
                  className="w-56 lg:w-64 pl-9 pr-4 py-1.5 bg-slate-100/70 dark:bg-slate-900 border border-transparent rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-300 dark:focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                />
              </div>

              {/* DROPDOWN RESULTS */}
              {isSearchFocused && searchQuery.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-full lg:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Menu Results
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <div
                          key={item.href}
                          onClick={() => {
                            router.push(item.href);
                            setSearchQuery("");
                            setIsSearchFocused(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800/50 cursor-pointer border-b last:border-0 border-slate-50 dark:border-slate-800 transition-colors"
                        >
                          <div className="p-1.5 bg-blue-100/50 dark:bg-blue-900/30 rounded-md">
                            <item.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.href}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        No matches found for "<span className="font-semibold">{searchQuery}</span>"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            {/* 👇 DARK MODE TOGGLE BUTTON 👇 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 py-1 h-auto rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-medium text-sm">
                      {user.firstName?.[0] || user.email?.[0] || role?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start mr-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none mb-1">
                      {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 leading-none">
                      {role?.replace("_", " ")}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 dark:bg-slate-950 dark:border-slate-800">
                <DropdownMenuLabel className="dark:text-slate-200">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-slate-800" />
                
                <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)} className="cursor-pointer flex items-center dark:text-slate-300 dark:focus:bg-slate-800">
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="dark:bg-slate-800" />
                
                <DropdownMenuItem onClick={() => setIsLogoutModalOpen(true)} className="text-red-600 dark:text-red-400 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700 dark:focus:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" /> Secure Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto transition-colors duration-300">
          {children}
        </main>
      </div>

      {/* User Profile Popup Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 dark:bg-red-500/10 mb-4 border-[6px] border-red-50/50 dark:border-red-500/20">
                <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Ready to Leave?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Are you sure you want to log out of your account? You will need to sign in again to access your portal.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => setIsLogoutModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  className="flex-1 shadow-sm"
                  onClick={logout}
                >
                  Yes, Log out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}