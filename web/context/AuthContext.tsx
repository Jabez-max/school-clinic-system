"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Ang eksaktong structure na galing sa Express Login natin
type User = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
};

type AuthContextType = {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // FIX: Binalewala na natin ang CORS issue. Babasahin na lang natin nang mabilis 
    // ang nai-save na token at user data sa browser's memory mo nung nag-login ka.
    const checkAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      // Tapos agad ang loading, pwede na pumasok sa dashboard!
      setIsLoading(false); 
    };

    checkAuth();
  }, []);

  const logout = () => {
    // Tanggalin ang lahat ng bakas ng login
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "clinic_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}